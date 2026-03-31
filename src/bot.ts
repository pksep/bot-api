import { ApiClient } from './api';
import { PollingManager } from './polling';
import {
  User,
  Chat,
  Message,
  DeletedMessage,
  Update,
  WebhookInfo,
  SepBotOptions,
  PollingOptions,
  SendMessageParams,
  EditMessageTextParams,
  DeleteMessageParams,
  GetUpdatesParams,
  SetWebhookParams,
  GetChatParams,
  EventMap,
  SepBotError,
  PollingError
} from './types';

/**
 * Sep Chat Bot API client.
 *
 * Provides a Telegram-style interface for building bots
 * on the sep-chat platform.
 *
 * @example
 * ```typescript
 * import { SepBot } from '@pksep/bot-api';
 *
 * const bot = new SepBot('1:abc123...', 'https://bot-api.example.com/api', {
 *   polling: true
 * });
 *
 * bot.on('message', async (msg) => {
 *   await bot.sendMessage(msg.chat.id, `Echo: ${msg.text}`);
 * });
 * ```
 */
export class SepBot {
  private readonly api: ApiClient;
  private polling: PollingManager | null = null;
  private readonly listeners: Map<string, Set<Function>> = new Map();

  /**
   * @param token — Bot API token (format: `{botId}:{secret}`)
   * @param serverUrl — Bot API server URL (e.g. `https://bot-api.example.com/api`)
   * @param options — optional configuration
   */
  constructor(
    private readonly token: string,
    serverUrl: string,
    private readonly options: SepBotOptions = {}
  ) {
    const timeout = options.requestTimeout || 30_000;

    this.api = new ApiClient(token, serverUrl, timeout);

    // Auto-start polling if requested
    if (options.polling) {
      const pollingOpts: PollingOptions =
        typeof options.polling === 'object' ? options.polling : {};

      if (pollingOpts.autoStart !== false) {
        this.startPolling(pollingOpts);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Event System
  // ═══════════════════════════════════════════════════════════

  /**
   * Register an event handler.
   *
   * @example
   * ```typescript
   * bot.on('message', (msg) => console.log(msg.text));
   * bot.on('edited_message', (msg) => console.log('Edited:', msg.text));
   * bot.on('deleted_message', (msg) => console.log('Deleted:', msg.message_id));
   * bot.on('polling_error', (err) => console.error(err));
   * ```
   */
  on<K extends keyof EventMap>(event: K, handler: EventMap[K]): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return this;
  }

  /** Remove an event handler */
  off<K extends keyof EventMap>(event: K, handler: EventMap[K]): this {
    this.listeners.get(event)?.delete(handler);
    return this;
  }

  /** Remove all handlers for an event (or all events) */
  removeAllListeners(event?: keyof EventMap): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  private emit(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;

    for (const handler of handlers) {
      try {
        const result = handler(...args);
        // Handle async errors
        if (result instanceof Promise) {
          result.catch((err: unknown) => {
            this.emit('error', new SepBotError(
              `Async handler error: ${err instanceof Error ? err.message : String(err)}`
            ));
          });
        }
      } catch (err: unknown) {
        this.emit('error', new SepBotError(
          `Handler error: ${err instanceof Error ? err.message : String(err)}`
        ));
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Polling
  // ═══════════════════════════════════════════════════════════

  /**
   * Start automatic long polling.
   *
   * @example
   * ```typescript
   * bot.startPolling({ timeout: 30, interval: 500 });
   * ```
   */
  startPolling(options: PollingOptions = {}): void {
    if (this.polling?.isRunning) {
      this.polling.stop();
    }

    this.polling = new PollingManager(
      this.api,
      (updates) => this.processUpdates(updates),
      (error) => this.emit('polling_error', error),
      options
    );

    this.polling.start();
  }

  /** Stop polling */
  stopPolling(): void {
    this.polling?.stop();
    this.polling = null;
  }

  /** Whether polling is active */
  get isPolling(): boolean {
    return this.polling?.isRunning ?? false;
  }

  /**
   * Process a batch of updates.
   * Called automatically by polling, or can be called manually for webhooks.
   */
  processUpdates(updates: Update[]): void {
    for (const update of updates) {
      if (update.message) {
        this.emit('message', update.message);
      }
      if (update.edited_message) {
        this.emit('edited_message', update.edited_message);
      }
      if (update.deleted_message) {
        this.emit('deleted_message', update.deleted_message);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  //  Bot Info
  // ═══════════════════════════════════════════════════════════

  /**
   * Get info about the bot.
   *
   * @returns Bot user object
   *
   * @example
   * ```typescript
   * const me = await bot.getMe();
   * console.log(`I am ${me.first_name} (@${me.username})`);
   * ```
   */
  async getMe(): Promise<User> {
    return this.api.call<User>('getMe');
  }

  // ═══════════════════════════════════════════════════════════
  //  Messages
  // ═══════════════════════════════════════════════════════════

  /**
   * Send a text message.
   *
   * @param chatId — target chat / topic ID
   * @param text — message text
   * @param options — optional parameters
   * @returns sent message
   *
   * @example
   * ```typescript
   * const msg = await bot.sendMessage('topic-uuid', 'Hello!');
   * console.log(`Sent message ${msg.message_id}`);
   *
   * // With reply
   * await bot.sendMessage('topic-uuid', 'Reply!', {
   *   reply_to_message_id: msg.message_id
   * });
   * ```
   */
  async sendMessage(
    chatId: string,
    text: string,
    options?: Omit<SendMessageParams, 'chat_id' | 'text'>
  ): Promise<Message> {
    return this.api.call<Message>('sendMessage', {
      chat_id: chatId,
      text,
      ...options
    });
  }

  /**
   * Edit a message text.
   *
   * @param chatId — chat / topic ID
   * @param messageId — message to edit
   * @param text — new text
   * @param options — optional parameters
   * @returns edited message
   *
   * @example
   * ```typescript
   * await bot.editMessageText('topic-uuid', msg.message_id, 'Updated text');
   * ```
   */
  async editMessageText(
    chatId: string,
    messageId: string,
    text: string,
    options?: Omit<EditMessageTextParams, 'chat_id' | 'message_id' | 'text'>
  ): Promise<Message> {
    return this.api.call<Message>('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options
    });
  }

  /**
   * Delete a message.
   *
   * @param chatId — chat / topic ID
   * @param messageId — message to delete
   * @returns true on success
   *
   * @example
   * ```typescript
   * await bot.deleteMessage('topic-uuid', msg.message_id);
   * ```
   */
  async deleteMessage(chatId: string, messageId: string): Promise<boolean> {
    return this.api.call<boolean>('deleteMessage', {
      chat_id: chatId,
      message_id: messageId
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  Updates
  // ═══════════════════════════════════════════════════════════

  /**
   * Get updates manually (for custom polling or one-off checks).
   *
   * @param options — offset, limit, timeout
   * @returns array of updates
   *
   * @example
   * ```typescript
   * const updates = await bot.getUpdates({ timeout: 10, limit: 5 });
   * for (const upd of updates) {
   *   console.log(upd.message?.text);
   * }
   * ```
   */
  async getUpdates(options?: GetUpdatesParams): Promise<Update[]> {
    const timeout = options?.timeout ?? 30;
    const httpTimeout = (timeout + 5) * 1000;

    return this.api.callWithTimeout<Update[]>(
      'getUpdates',
      {
        offset: options?.offset,
        limit: options?.limit,
        timeout
      },
      httpTimeout
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  Webhooks
  // ═══════════════════════════════════════════════════════════

  /**
   * Set a webhook URL.
   * Bot API will POST updates to this URL.
   *
   * @param url — HTTPS URL for receiving updates
   * @param options — optional config
   * @returns true on success
   *
   * @example
   * ```typescript
   * await bot.setWebhook('https://my-server.com/webhook/bot1');
   * ```
   */
  async setWebhook(
    url: string,
    options?: Omit<SetWebhookParams, 'url'>
  ): Promise<boolean> {
    return this.api.call<boolean>('setWebhook', { url, ...options });
  }

  /**
   * Delete the webhook.
   * After deletion, use getUpdates / polling to receive updates.
   */
  async deleteWebhook(): Promise<boolean> {
    return this.api.call<boolean>('deleteWebhook');
  }

  /**
   * Get current webhook status.
   */
  async getWebhookInfo(): Promise<WebhookInfo> {
    return this.api.call<WebhookInfo>('getWebhookInfo');
  }

  // ═══════════════════════════════════════════════════════════
  //  Chats
  // ═══════════════════════════════════════════════════════════

  /**
   * Get information about a chat.
   *
   * @param chatId — chat / topic ID
   * @returns chat object
   */
  async getChat(chatId: string): Promise<Chat> {
    return this.api.call<Chat>('getChat', { chat_id: chatId });
  }

  /**
   * Get number of members in a chat.
   *
   * @param chatId — chat / topic ID
   * @returns member count
   */
  async getChatMembersCount(chatId: string): Promise<number> {
    return this.api.call<number>('getChatMembersCount', { chat_id: chatId });
  }

  // ═══════════════════════════════════════════════════════════
  //  Lifecycle
  // ═══════════════════════════════════════════════════════════

  /**
   * Stop the bot gracefully (stop polling, clear handlers).
   */
  stop(): void {
    this.stopPolling();
    this.removeAllListeners();
  }
}
