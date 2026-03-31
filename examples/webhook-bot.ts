/**
 * Webhook Bot — приём обновлений через webhook (Express).
 *
 * Запуск: bun run examples/webhook-bot.ts
 */
import { SepBot, Update } from '../src';
import { createServer, IncomingMessage, ServerResponse } from 'http';

const BOT_TOKEN = process.env.BOT_TOKEN || '1:your-token-here';
const WEBHOOK_PORT = Number(process.env.WEBHOOK_PORT) || 8443;
const WEBHOOK_URL = process.env.WEBHOOK_URL || `http://localhost:${WEBHOOK_PORT}/webhook`;

const API_URL = process.env.API_URL!;

// Без polling — обновления придут через webhook
const bot = new SepBot(BOT_TOKEN, API_URL);

bot.on('message', async (msg) => {
  if (msg.text) {
    await bot.sendMessage(msg.chat.id, `Webhook echo: ${msg.text}`);
  }
});

// ─── HTTP Server ────────────────────────────────────────

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString()) as Update;
    bot.processUpdates([body]);

    res.writeHead(200);
    res.end('ok');
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// ─── Start ──────────────────────────────────────────────

async function main() {
  // Register webhook
  await bot.setWebhook(WEBHOOK_URL);
  console.log(`✅ Webhook set to ${WEBHOOK_URL}`);

  server.listen(WEBHOOK_PORT, () => {
    console.log(`🤖 Webhook bot listening on port ${WEBHOOK_PORT}`);
  });
}

main().catch(console.error);
