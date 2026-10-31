import { api } from 'sdk';

export default async function (message, ctx) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();
  const userId = message.from ? message.from.id : chatId;
  const firstName = message.from ? message.from.first_name : 'Батыр';

  const GAME_URL = 'https://app9207991607.tgcloud.ai';
  const BOT_USERNAME = 'chukobattle_bot';

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

    await api.sendMessage({
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'HTML',
      reply_markup: {
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
              url: `https://t.me/share/url?url=https://t.me/${BOT_USERNAME}?startapp=ref_${userId}&text=${encodeURIComponent('Сыграй со мной в кыргызское Ордо в Chuko Royal! Заходи:')}`
            }
          ],
          [
            {
              text: '📜 Правила игры',
              callback_data: 'help_rules'
            }
          ]
        ]
      }
    });
    return;
  }

  if (text === '/play') {
    await api.sendMessage({
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
      `Жми кнопку «🎮 Играть» внизу экрана для начала боя!`;

    await api.sendMessage({
      chat_id: chatId,
      text: helpText,
      parse_mode: 'HTML'
    });
    return;
  }
}
