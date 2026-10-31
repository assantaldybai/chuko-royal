// ============================================================
// Chuko Royal — Serverless Telegram Bot (Cloudflare Worker)
// Bot: @chukobattle_bot
// Zero dependencies — 100% standard Web API (fetch, Request, Response)
// ============================================================

const DEFAULT_BOT_TOKEN = '9207991607:AAEakmdKTLUMIu0yveZ7fIn3UqS-81NE770';
const DEFAULT_GAME_URL = 'https://chuko.uyoom.app';
const DEFAULT_BOT_USERNAME = 'chukobattle_bot';

export default {
  async fetch(request, env = {}) {
    const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
    const GAME_URL = env.GAME_URL || DEFAULT_GAME_URL;
    const BOT_USERNAME = env.BOT_USERNAME || DEFAULT_BOT_USERNAME;
    const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

    const url = new URL(request.url);

    // 1. Health check & status endpoint (GET /)
    if (request.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      return new Response(JSON.stringify({
        status: 'online',
        service: 'Chuko Royal Telegram Serverless Bot',
        bot: '@' + BOT_USERNAME,
        tma_url: GAME_URL,
        timestamp: new Date().toISOString()
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Automated Webhook Setup helper (GET /set-webhook)
    if (request.method === 'GET' && url.pathname === '/set-webhook') {
      const webhookUrl = `${url.origin}/webhook`;
      const tgRes = await fetch(`${API_BASE}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query', 'pre_checkout_query']
        })
      });
      const tgData = await tgRes.json();
      return new Response(JSON.stringify({
        action: 'setWebhook',
        webhook_target: webhookUrl,
        telegram_response: tgData
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 3. Webhook Info helper (GET /webhook-info)
    if (request.method === 'GET' && url.pathname === '/webhook-info') {
      const tgRes = await fetch(`${API_BASE}/getWebhookInfo`);
      const tgData = await tgRes.json();
      return new Response(JSON.stringify(tgData, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Handle incoming Telegram Webhook updates (POST / or POST /webhook)
    if (request.method === 'POST') {
      try {
        const update = await request.json();
        await handleUpdate(update, API_BASE, GAME_URL, BOT_USERNAME);
        return new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error('[Worker Error]:', err);
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
};

async function tgApi(apiBase, method, payload = {}) {
  const res = await fetch(`${apiBase}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

async function handleUpdate(update, apiBase, gameUrl, botUsername) {
  // A. Handle Pre-Checkout Query for Telegram Stars payments
  if (update.pre_checkout_query) {
    const q = update.pre_checkout_query;
    await tgApi(apiBase, 'answerPreCheckoutQuery', {
      pre_checkout_query_id: q.id,
      ok: true
    });
    return;
  }

  // B. Handle Callback Queries from inline buttons
  if (update.callback_query) {
    const cb = update.callback_query;
    if (cb.data === 'help_rules') {
      const text = `📜 <b>Правила кыргызского Ордо (Chuko Royal)</b>:\n\n` +
        `• <b>Цель</b>: выбить альчики из священного круга Ордо своим утяжеленным битком (Сака).\n` +
        `• <b>Хан</b>: центральный красный альчик. Выбивание Хана приносит супер-очки!\n` +
        `• <b>Управление</b>: оттягивайте биток назад для натяжения, регулируйте силу и отпускайте для хлесткого запуска!`;

      await tgApi(apiBase, 'answerCallbackQuery', {
        callback_query_id: cb.id,
        text: 'Кыргызское 3D Ордо — играй и побеждай!',
        show_alert: false
      });

      if (cb.message) {
        await tgApi(apiBase, 'sendMessage', {
          chat_id: cb.message.chat.id,
          text: text,
          parse_mode: 'HTML'
        });
      }
    }
    return;
  }

  // C. Handle Messages
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();
    const userId = msg.from ? msg.from.id : chatId;
    const firstName = msg.from ? msg.from.first_name : 'Батыр';

    // Successful payment notification
    if (msg.successful_payment) {
      const p = msg.successful_payment;
      await tgApi(apiBase, 'sendMessage', {
        chat_id: chatId,
        text: `🎉 <b>Оплата успешна!</b>\nПолучено: <b>${p.total_amount} ⭐ Telegram Stars</b>.\nНаграда зачислена на ваш аккаунт в игре!`,
        parse_mode: 'HTML'
      });
      return;
    }

    // /start command with deep linking
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      const startParam = parts[1] || '';

      let welcomeText = `Салам, <b>${firstName}</b>! 🦅\n\n`;
      welcomeText += `Добро пожаловать в <b>Chuko Royal</b> — первую казуальную 3D игру в кыргызские альчики (Ордо) прямо в Telegram!\n\n`;
      welcomeText += `🦴 <b>Реалистичная физика костей Ovis aries</b>\n`;
      welcomeText += `🎯 <b>Онлайн дуэли 1 на 1 и тренировки</b>\n`;
      welcomeText += `⚙️ <b>Мастерская Сака</b>: прокачивай биток, заливку и тамгу\n`;
      welcomeText += `⛺ <b>Развивай Орду</b> и сражайся за первенство в Лиге!\n\n`;
      welcomeText += `Нажми кнопку ниже, чтобы запустить игру:`;

      const playUrl = startParam ? `${gameUrl}?startapp=${startParam}` : gameUrl;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: '🎮 ИГРАТЬ В ОРДО (3D)',
              web_app: { url: playUrl }
            }
          ],
          [
            {
              text: '👥 Позвать друга в дуэль',
              url: `https://t.me/share/url?url=https://t.me/${botUsername}?startapp=ref_${userId}&text=${encodeURIComponent('Сыграй со мной в кыргызское Ордо в Chuko Royal! Заходи:')}`
            }
          ],
          [
            {
              text: '📜 Правила игры',
              callback_data: 'help_rules'
            }
          ]
        ]
      };

      await tgApi(apiBase, 'sendMessage', {
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      return;
    }

    if (text === '/play') {
      await tgApi(apiBase, 'sendMessage', {
        chat_id: chatId,
        text: '🎯 Нажми кнопку, чтобы открыть Chuko Royal:',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Запустить игру', web_app: { url: gameUrl } }]
          ]
        }
      });
      return;
    }

    if (text === '/help') {
      const helpText = `📜 <b>Правила кыргызского Ордо (Chuko Royal)</b>\n\n` +
        `1. <b>Цель игры</b> — выбить альчики из священного круга Ордо своим утяжеленным битком (Сака).\n` +
        `2. <b>Хан</b> — центральный красный альчик. Выбивание Хана приносит 3 очка и победу при соблюдении правил!\n` +
        `3. <b>Управление</b>: оттяните Сака пальцем назад для натяжения, выберите силу и отпустите для хлесткого удара!\n` +
        `4. <b>Кастомизация</b>: во вкладке «Мастерская» улучшайте вес свинцовой пломбы, чеканку тамги и материал кости.\n\n` +
        `Жми кнопку «🎮 Играть» внизу экрана для начала боя!`;

      await tgApi(apiBase, 'sendMessage', {
        chat_id: chatId,
        text: helpText,
        parse_mode: 'HTML'
      });
      return;
    }

    // Telegram Stars In-App Purchase test command
    if (text === '/stars' || text === '/donate') {
      await tgApi(apiBase, 'sendInvoice', {
        chat_id: chatId,
        title: 'Сундук Ханских Сокровищ ⭐',
        description: '10,000 монет + 50 баксов + Золотой Сака для Chuko Royal!',
        payload: `stars_chest_${userId}_${Date.now()}`,
        currency: 'XTR', // Telegram Stars currency code
        prices: [{ label: 'Ханский Сундук', amount: 50 }] // 50 Telegram Stars
      });
      return;
    }
  }
}
