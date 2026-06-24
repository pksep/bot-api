export { SepBot } from './bot';
export { ApiClient } from './api';
export { parseWebhookUpdate } from './webhook';

export type {
  // Core types
  User,
  Chat,
  Message,
  DeletedMessage,
  Update,
  WebhookInfo,

  // Parameters
  SendMessageParams,
  EditMessageTextParams,
  DeleteMessageParams,
  GetUpdatesParams,
  SetWebhookParams,
  GetChatParams,

  // Files
  MessageMedia,
  InputFile,
  SendDocumentParams,
  UploadUrlResult,

  // Options
  SepBotOptions,
  PollingOptions,

  // Events
  UpdateType,
  MessageHandler,
  DeletedMessageHandler,
  ErrorHandler,
  EventMap,

  // Response
  ApiResponse
} from './types';

export type { ParseWebhookOptions } from './webhook';

export { SepBotError, ApiError, PollingError } from './types';
