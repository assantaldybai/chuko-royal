// ============================================================
// Chuko Royal — Vercel Serverless Function
// Path: /api/bot
// ============================================================

import worker from '../worker.js';

export const config = {
  runtime: 'edge'
};

export default async function handler(request) {
  return worker.fetch(request, {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '9207991607:AAEakmdKTLUMIu0yveZ7fIn3UqS-81NE770',
    GAME_URL: process.env.GAME_URL || 'https://chuko.uyoom.app',
    BOT_USERNAME: process.env.BOT_USERNAME || 'chukobattle_bot'
  });
}
