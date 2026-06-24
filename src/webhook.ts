import { Update, SepBotError } from './types';

/** Опции разбора входящего webhook-запроса. */
export interface ParseWebhookOptions {
  /**
   * Ожидаемый секрет (тот же, что передан в `bot.setWebhook(url, { secret })`).
   * Если задан — `signature` обязан совпасть, иначе бросается ошибка.
   */
  secret?: string;
  /**
   * Значение секрета из входящего запроса — например, заголовок
   * `X-Sep-Bot-Signature`, который Сеп-бот проставляет при доставке.
   */
  signature?: string;
}

/**
 * Разобрать тело входящего webhook-запроса в `Update`.
 *
 * Сеп-бот доставляет ровно один `Update` на POST (как Telegram Bot API).
 * Полученный объект можно передать в `bot.processUpdates([update])`.
 *
 * @example
 * ```typescript
 * app.post('/webhook', (req, res) => {
 *   const update = parseWebhookUpdate(req.body, {
 *     secret: process.env.WEBHOOK_SECRET,
 *     signature: req.header('X-Sep-Bot-Signature')
 *   });
 *   bot.processUpdates([update]);
 *   res.sendStatus(200);
 * });
 * ```
 *
 * @throws {SepBotError} если секрет не совпал или тело невалидно.
 */
export function parseWebhookUpdate(
  body: unknown,
  options: ParseWebhookOptions = {}
): Update {
  if (options.secret !== undefined && options.signature !== options.secret) {
    throw new SepBotError('Webhook signature mismatch');
  }

  if (typeof body !== 'object' || body === null) {
    throw new SepBotError('Invalid webhook body: expected a JSON object');
  }

  const update = body as Partial<Update>;
  if (typeof update.update_id !== 'number') {
    throw new SepBotError('Invalid webhook update: missing numeric "update_id"');
  }

  return update as Update;
}
