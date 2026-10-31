// ============================================================
// Chuko Royal — Official Telegram Bot Service
// Bot: @chukobattle_bot
// Runs via Node.js native HTTPS (zero external npm dependencies required)
// ============================================================

const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9207991607:AAEakmdKTLUMIu0yveZ7fIn3UqS-81NE770';
const GAME_URL = 'https://chuko.uyoom.app';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

function apiRequest(method, data = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const url = new URL(`${API_BASE}/${method}`);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve({ ok: false, error: body });
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(payload);
    req.end();
  });
}

let lastOffset = 0;

async function pollUpdates() {
  try {
    const res = await apiRequest('getUpdates', {
      offset: lastOffset,
      timeout: 30,
      allowed_updates: ['message', 'callback_query', 'pre_checkout_query']
    });

    if (res && res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        lastOffset = update.update_id + 1;
        await handleUpdate(update);
      }
    }
  } catch (err) {
    console.error('[Bot Error]:', err.message);
    await new Promise(r => setTimeout(r, 3000));
  }

  setImmediate(pollUpdates);
}

async function handleUpdate(update) {
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = (msg.text || '').trim();
    const userId = msg.from ? msg.from.id : chatId;
    const firstName = msg.from ? msg.from.first_name : 'Батыр';

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

      const playUrl = startParam ? `${GAME_URL}?startapp=${startParam}` : GAME_URL;

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
              url: `https://t.me/share/url?url=https://t.me/chukobattle_bot?startapp=ref_${userId}&text=${encodeURIComponent('Сыграй со мной в кыргызское Ордо в Chuko Royal! Заходи:')}`
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

      await apiRequest('sendMessage', {
        chat_id: chatId,
        text: welcomeText,
        parse_mode: 'HTML',
        reply_markup: keyboard
      });
      return;
    }

    if (text === '/play') {
      await apiRequest('sendMessage', {
        chat_id: chatId,
        text: '🎯 Нажми кнопку, чтобы открыть Chuko Royal:',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Запустить игру', web_app: { url: GAME_URL } }]
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
        `Жми кнопку меню внизу экрана для начала боя!`;

      await apiRequest('sendMessage', {
        chat_id: chatId,
        text: helpText,
        parse_mode: 'HTML'
      });
      return;
    }
  }

  if (update.callback_query) {
    const cb = update.callback_query;
    if (cb.data === 'help_rules') {
      const helpText = `📜 <b>Правила игры</b>:\nОттягивай биток Сака назад, триггерь хлесткий спуск и выбивай альчики за границу круга! За выбивание Хана дается супер-награда!`;
      await apiRequest('answerCallbackQuery', {
        callback_query_id: cb.id,
        text: helpText,
        show_alert: true
      });
    }
  }
}

// Start polling
console.log('======================================================');
console.log('🤖 Chuko Royal Telegram Bot (@chukobattle_bot) STARTED');
console.log(`🔗 Web App Target: ${GAME_URL}`);
console.log('======================================================');

pollUpdates();
