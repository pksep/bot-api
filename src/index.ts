export { SepBot } from './bot';
export { ApiClient } from './api';

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

export { SepBotError, ApiError, PollingError } from './types';
