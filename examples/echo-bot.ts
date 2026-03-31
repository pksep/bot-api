/**
 * Echo Bot — отвечает тем же текстом на каждое сообщение.
 *
 * Запуск: bun run examples/echo-bot.ts
 */
import { SepBot } from '../src';

const BOT_TOKEN = process.env.BOT_TOKEN || '1:your-token-here';

const API_URL = process.env.API_URL!;

const bot = new SepBot(BOT_TOKEN, API_URL, { polling: true });

bot.on('message', async (msg) => {
  if (!msg.text) return;

  console.log(`[${msg.chat.id}] ${msg.from?.username}: ${msg.text}`);

  await bot.sendMessage(msg.chat.id, `Echo: ${msg.text}`);
});

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
});

console.log('🤖 Echo bot started. Waiting for messages...');
