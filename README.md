# @pksep/bot-api

Telegram-style Bot SDK for the **sep-chat** platform.

Build bots that send messages, handle commands, and receive real-time updates — just like Telegram Bot API.

## Install

```bash
bun add @pksep/bot-api
```

## Quick Start

```typescript
import { SepBot } from '@pksep/bot-api';

const bot = new SepBot('1:abc123...', {
  baseUrl: 'https://bot-api.example.com/api',
  polling: true
});

bot.on('message', async (msg) => {
  if (msg.text === '/start') {
    await bot.sendMessage(msg.chat.id, 'Hello! 👋');
  }
});
```

## API Reference

### Constructor

```typescript
new SepBot(token: string, options?: SepBotOptions)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `http://localhost:3001/api` | Bot API server URL |
| `polling` | `boolean \| PollingOptions` | `false` | Enable auto polling |
| `requestTimeout` | `number` | `30000` | HTTP timeout (ms) |

### Methods

#### Bot Info

```typescript
const me = await bot.getMe();
// { id: 1, is_bot: true, first_name: 'MyBot', username: 'my_bot' }
```

#### Messages

```typescript
// Send
const msg = await bot.sendMessage('chat-id', 'Hello!');
const reply = await bot.sendMessage('chat-id', 'Reply!', {
  reply_to_message_id: msg.message_id
});

// Edit
await bot.editMessageText('chat-id', msg.message_id, 'Updated text');

// Delete
await bot.deleteMessage('chat-id', msg.message_id);
```

#### Updates (Long Polling)

```typescript
// Automatic (recommended)
bot.startPolling({ timeout: 30 });
bot.on('message', (msg) => { /* ... */ });

// Manual
const updates = await bot.getUpdates({ timeout: 10, limit: 5 });
```

#### Webhooks

```typescript
await bot.setWebhook('https://my-server.com/webhook');
await bot.deleteWebhook();
const info = await bot.getWebhookInfo();
```

#### Chats

```typescript
const chat = await bot.getChat('chat-id');
const count = await bot.getChatMembersCount('chat-id');
```

### Events

```typescript
bot.on('message', (msg) => { });           // New message
bot.on('edited_message', (msg) => { });    // Edited message
bot.on('deleted_message', (msg) => { });   // Deleted message
bot.on('polling_error', (err) => { });     // Polling error
bot.on('error', (err) => { });             // General error
```

### Lifecycle

```typescript
bot.startPolling();    // Start polling
bot.stopPolling();     // Stop polling
bot.isPolling;         // boolean

bot.stop();            // Stop everything + clear handlers
```

## Examples

### Echo Bot

```typescript
import { SepBot } from '@pksep/bot-api';

const bot = new SepBot(process.env.BOT_TOKEN!, { polling: true });

bot.on('message', async (msg) => {
  if (msg.text) {
    await bot.sendMessage(msg.chat.id, `Echo: ${msg.text}`);
  }
});
```

### Command Bot

```typescript
import { SepBot } from '@pksep/bot-api';

const bot = new SepBot(process.env.BOT_TOKEN!, { polling: true });

bot.on('message', async (msg) => {
  if (!msg.text) return;

  if (msg.text === '/ping') {
    const start = Date.now();
    const sent = await bot.sendMessage(msg.chat.id, '🏓 Pong!');
    await bot.editMessageText(
      msg.chat.id,
      sent.message_id,
      `🏓 Pong! (${Date.now() - start}ms)`
    );
  }
});
```

### Webhook (Node.js HTTP)

```typescript
import { SepBot, Update } from '@pksep/bot-api';
import { createServer } from 'http';

const bot = new SepBot(process.env.BOT_TOKEN!);

bot.on('message', async (msg) => {
  await bot.sendMessage(msg.chat.id, `Got: ${msg.text}`);
});

createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const update = JSON.parse(Buffer.concat(chunks).toString()) as Update;
    bot.processUpdates([update]);
    res.writeHead(200).end('ok');
  } else {
    res.writeHead(404).end();
  }
}).listen(8443);

await bot.setWebhook('https://my-server.com/webhook');
```

## Error Handling

```typescript
import { SepBotError, ApiError, PollingError } from '@pksep/bot-api';

try {
  await bot.sendMessage('invalid-chat', 'test');
} catch (err) {
  if (err instanceof ApiError) {
    console.log(err.method);      // 'sendMessage'
    console.log(err.statusCode);  // 400
    console.log(err.message);     // 'API error on sendMessage: [400] ...'
  }
}

bot.on('polling_error', (err: PollingError) => {
  console.error('Polling failed:', err.message);
  // Auto-retries — no need to restart
});
```

## Types

All types are exported and available for use:

```typescript
import type {
  Message,
  User,
  Chat,
  Update,
  SendMessageParams,
  SepBotOptions,
  PollingOptions
} from '@pksep/bot-api';
```

## License

MIT
