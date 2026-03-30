import {
  ApiResponse,
  ApiError,
  SepBotError
} from './types';

const DEFAULT_TIMEOUT = 30_000;

/**
 * Low-level HTTP client for Sep Chat Bot API.
 * Handles request/response serialization, error mapping, and retries.
 */
export class ApiClient {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeout: number;

  constructor(token: string, baseUrl: string, timeout = DEFAULT_TIMEOUT) {
    this.token = token;
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeout = timeout;
  }

  /**
   * Call a Bot API method.
   *
   * @param method — API method name (e.g. 'sendMessage')
   * @param params — request body
   * @returns parsed result from API response
   * @throws {ApiError} on non-ok response
   * @throws {SepBotError} on network/timeout errors
   */
  async call<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const url = `${this.baseUrl}/bot${this.token}/${method}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal
      });

      const data = (await response.json()) as ApiResponse<T>;

      if (!data.ok) {
        throw new ApiError(
          method,
          data.error_code || response.status,
          data.description || 'Unknown API error',
          data
        );
      }

      return data.result as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new SepBotError(
            `Request to ${method} timed out after ${this.timeout}ms`
          );
        }
        throw new SepBotError(`Network error on ${method}: ${err.message}`);
      }

      throw new SepBotError(`Unknown error on ${method}: ${String(err)}`);
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Call with extended timeout (for long polling).
   */
  async callWithTimeout<T>(
    method: string,
    params: Record<string, unknown>,
    timeoutMs: number
  ): Promise<T> {
    const url = `${this.baseUrl}/bot${this.token}/${method}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal
      });

      const data = (await response.json()) as ApiResponse<T>;

      if (!data.ok) {
        throw new ApiError(
          method,
          data.error_code || response.status,
          data.description || 'Unknown API error',
          data
        );
      }

      return data.result as T;
    } catch (err: unknown) {
      if (err instanceof ApiError) throw err;
      if (err instanceof Error && err.name === 'AbortError') {
        throw new SepBotError(`Long polling timed out after ${timeoutMs}ms`);
      }
      throw new SepBotError(
        `Network error on ${method}: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      clearTimeout(timer);
    }
  }
}
