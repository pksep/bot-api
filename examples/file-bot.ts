/**
 * file-bot — пример отправки файлов через Сеп-бот API.
 *
 * Запуск (на Маке): bun run examples/file-bot.ts
 */
import { readFileSync } from 'fs';
import { SepBot } from '../src';

const TOKEN = process.env.BOT_TOKEN ?? '1:secret';
const SERVER = process.env.BOT_API_URL ?? 'http://localhost:3000/api';

const bot = new SepBot(TOKEN, SERVER, { polling: true });

// По команде /report присылаем PDF из файловой системы.
bot.on('message', async (msg) => {
  if (!msg.text || !msg.chat) return;

  if (msg.text.startsWith('/report')) {
    const pdf = readFileSync('report.pdf');
    await bot.sendDocument(
      msg.chat.id,
      { data: pdf, filename: 'report.pdf', contentType: 'application/pdf' },
      { caption: 'Отчёт за месяц', reply_to_message_id: msg.message_id }
    );
    return;
  }

  if (msg.text.startsWith('/pic')) {
    const png = readFileSync('photo.png');
    await bot.sendPhoto(msg.chat.id, {
      data: png,
      filename: 'photo.png',
      contentType: 'image/png'
    });
  }
});

bot.on('polling_error', (err) => console.error('polling error:', err.message));

console.log('file-bot is running (polling)...');
