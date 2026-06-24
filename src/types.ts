// ─── Core Types ──────────────────────────────────────────

/** Информация о пользователе / боте */
export interface User {
  id: number | string;
  is_bot: boolean;
  first_name: string;
  username?: string;
  last_name?: string;
}

/** Информация о чате */
export interface Chat {
  id: string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
}

/** Вложение сообщения (файл в объектном хранилище) */
export interface MessageMedia {
  /** objectName в хранилище */
  path: string;
  thumbnail_path?: string;
  origin_name: string;
  size: number;
  type: 'IMAGE' | 'VIDEO' | 'FILE';
}

/** Сообщение */
export interface Message {
  message_id: string;
  from?: User;
  chat: Chat;
  date: number;
  text?: string;
  reply_to_message?: { message_id: string };
  /** Вложения (если есть) */
  media?: MessageMedia[];
}

/** Удалённое сообщение */
export interface DeletedMessage {
  message_id: string;
  chat: Chat;
}

/** Обновление (update) */
export interface Update {
  update_id: number;
  message?: Message;
  edited_message?: Message;
  deleted_message?: DeletedMessage;
}

/** Информация о webhook */
export interface WebhookInfo {
  url: string;
  has_custom_certificate?: boolean;
  pending_update_count?: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

// ─── API Response ────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  error_code?: number;
  description?: string;
}

// ─── Method Parameters ───────────────────────────────────

export interface SendMessageParams {
  /** ID чата / топика */
  chat_id: string;
  /** Текст сообщения */
  text: string;
  /** ID сообщения для ответа */
  reply_to_message_id?: string;
  /** Дополнительная разметка (кнопки и т.д.) */
  reply_markup?: Record<string, unknown>;
}

export interface EditMessageTextParams {
  /** ID чата / топика */
  chat_id: string;
  /** ID сообщения для редактирования */
  message_id: string;
  /** Новый текст */
  text: string;
  /** Дополнительная разметка */
  reply_markup?: Record<string, unknown>;
}

export interface DeleteMessageParams {
  /** ID чата / топика */
  chat_id: string;
  /** ID сообщения */
  message_id: string;
}

export interface GetUpdatesParams {
  /** Offset — получить обновления с ID > offset */
  offset?: number;
  /** Максимальное количество обновлений (1-100) */
  limit?: number;
  /** Timeout long polling в секундах (0-60) */
  timeout?: number;
}

export interface SetWebhookParams {
  /** URL для доставки обновлений */
  url: string;
  /** Секретный токен для верификации */
  secret?: string;
  /** Типы обновлений для получения */
  allowed_updates?: string[];
}

export interface GetChatParams {
  /** ID чата / топика */
  chat_id: string;
}

// ─── Files ───────────────────────────────────────────────

/** Входной файл для sendDocument / sendPhoto */
export interface InputFile {
  /** Содержимое файла */
  data: Uint8Array | ArrayBuffer | Blob;
  /** Имя файла с расширением */
  filename: string;
  /** MIME-тип (image/png, application/pdf, ...) */
  contentType?: string;
}

export interface SendDocumentParams {
  /** Подпись к файлу */
  caption?: string;
  /** ID сообщения для ответа */
  reply_to_message_id?: string;
}

/** Результат getUploadUrl — presigned-загрузка в хранилище */
export interface UploadUrlResult {
  /** file_id (objectName) — передаётся в sendDocument */
  file_id: string;
  /** presigned PUT URL для прямой загрузки файла */
  upload_url: string;
  /** публичная ссылка на скачивание */
  public_url: string;
}

// ─── Bot Options ─────────────────────────────────────────

export interface SepBotOptions {
  /** Включить автоматический polling */
  polling?: boolean | PollingOptions;
  /** Timeout для HTTP-запросов в мс (default: 30000) */
  requestTimeout?: number;
}

export interface PollingOptions {
  /** Интервал между запросами getUpdates, мс (default: 300) */
  interval?: number;
  /** Timeout long polling в секундах (default: 30) */
  timeout?: number;
  /** Максимум обновлений за запрос (default: 100) */
  limit?: number;
  /** Стартовый offset */
  offset?: number;
  /** Автостарт при создании (default: true) */
  autoStart?: boolean;
}

// ─── Event Types ─────────────────────────────────────────

export type UpdateType = 'message' | 'edited_message' | 'deleted_message';

export type MessageHandler = (message: Message) => void | Promise<void>;
export type DeletedMessageHandler = (message: DeletedMessage) => void | Promise<void>;
export type ErrorHandler = (error: SepBotError) => void;

export interface EventMap {
  message: MessageHandler;
  edited_message: MessageHandler;
  deleted_message: DeletedMessageHandler;
  polling_error: ErrorHandler;
  error: ErrorHandler;
}

// ─── Errors ──────────────────────────────────────────────

export class SepBotError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly response?: ApiResponse
  ) {
    super(message);
    this.name = 'SepBotError';
  }
}

export class ApiError extends SepBotError {
  constructor(
    public readonly method: string,
    public readonly statusCode: number,
    description: string,
    response?: ApiResponse
  ) {
    super(`API error on ${method}: [${statusCode}] ${description}`, statusCode, response);
    this.name = 'ApiError';
  }
}

export class PollingError extends SepBotError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'PollingError';
  }
}
