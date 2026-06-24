/**
 * Command Bot — обработка команд (/start, /help, /ping).
 *
 * Запуск: bun run examples/command-bot.ts
 */
import { SepBot, Message } from '../src';

const BOT_TOKEN = process.env.BOT_TOKEN || '1:your-token-here';

const API_URL = process.env.API_URL!;

const bot = new SepBot(BOT_TOKEN, API_URL, { polling: { timeout: 30 } });

// ─── Command registry ───────────────────────────────────

type CommandHandler = (msg: Message, args: string[]) => Promise<void>;
const commands = new Map<string, CommandHandler>();

function command(name: string, handler: CommandHandler) {
  commands.set(name, handler);
}

// ─── Commands ───────────────────────────────────────────

command('start', async (msg) => {
  await bot.sendMessage(
    msg.chat.id,
    '👋 Привет! Я бот-пример.\n\nКоманды:\n/help — справка\n/ping — проверка'
  );
});

command('help', async (msg) => {
  await bot.sendMessage(msg.chat.id, [
    '📚 **Список команд:**',
    '',
    '/start — приветствие',
    '/help — эта справка',
    '/ping — проверка связи',
    '/echo <текст> — повторить текст'
  ].join('\n'));
});

command('ping', async (msg) => {
  const start = Date.now();
  const sent = await bot.sendMessage(msg.chat.id, '🏓 Pong!');
  const latency = Date.now() - start;
  await bot.editMessageText(
    msg.chat.id,
    sent.message_id,
    `🏓 Pong! (${latency}ms)`
  );
});

command('echo', async (msg, args) => {
  const text = args.join(' ') || '🤷 Напишите текст после /echo';
  await bot.sendMessage(msg.chat.id, text, {
    reply_to_message_id: msg.message_id
  });
});

// ─── Message handler ────────────────────────────────────

bot.on('message', async (msg) => {
  if (!msg.text?.startsWith('/')) return;

  const parts = msg.text.slice(1).split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  const handler = commands.get(cmd);
  if (handler) {
    await handler(msg, args);
  } else {
    await bot.sendMessage(msg.chat.id, `❓ Неизвестная команда: /${cmd}`);
  }
});

bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
});

console.log('🤖 Command bot started. Send /start to begin.');
