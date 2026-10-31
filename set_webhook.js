#!/usr/bin/env node
// ============================================================
// Chuko Royal — Telegram Webhook Manager
// Usage:
//   node set_webhook.js check
//   node set_webhook.js set <https://your-worker.workers.dev>
//   node set_webhook.js delete
// ============================================================

const https = require('https');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9207991607:AAEakmdKTLUMIu0yveZ7fIn3UqS-81NE770';
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

function tg(method, payload = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const url = new URL(`${API_BASE}/${method}`);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (_) { resolve(body); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const action = process.argv[2] || 'check';
  const targetUrl = process.argv[3];

  console.log(`[Telegram Webhook Manager] Bot: @chukobattle_bot`);

  if (action === 'check') {
    const res = await tg('getWebhookInfo');
    console.log('\nТекущий статус вебхука:');
    console.log(JSON.stringify(res, null, 2));
    if (res.result && res.result.url) {
      console.log(`\n✓ Вебхук активен: ${res.result.url}`);
    } else {
      console.log('\nℹ️ Вебхук не установлен (бот работает через getUpdates / long polling).');
    }
  } else if (action === 'set') {
    if (!targetUrl || !targetUrl.startsWith('https://')) {
      console.error('Ошибка: укажите валидный HTTPS URL вебхука.');
      console.error('Пример: node set_webhook.js set https://chuko-bot.yourname.workers.dev');
      process.exit(1);
    }
    const res = await tg('setWebhook', {
      url: targetUrl.endsWith('/webhook') ? targetUrl : `${targetUrl.replace(/\/$/, '')}/webhook`,
      allowed_updates: ['message', 'callback_query', 'pre_checkout_query']
    });
    console.log('\nРезультат установки вебхука:');
    console.log(JSON.stringify(res, null, 2));
  } else if (action === 'delete') {
    const res = await tg('deleteWebhook');
    console.log('\nВебхук удален:');
    console.log(JSON.stringify(res, null, 2));
  }
}

main().catch(console.error);
