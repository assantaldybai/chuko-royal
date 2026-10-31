import { api } from 'sdk';

export default async function (cb, ctx) {
  if (cb.data === 'help_rules') {
    await api.answerCallbackQuery({
      callback_query_id: cb.id,
      text: 'Кыргызское 3D Ордо — играй и побеждай!',
      show_alert: false
    });

    if (cb.message) {
      const text = `📜 <b>Правила игры</b>:\nОттягивай биток Сака назад, триггерь хлесткий спуск и выбивай альчики за границу круга! За выбивание Хана дается супер-награда!`;
      await api.sendMessage({
        chat_id: cb.message.chat.id,
        text: text,
        parse_mode: 'HTML'
      });
    }
  }
}
