import { ApiClient } from './api';
import { Update, PollingOptions, PollingError } from './types';

const DEFAULTS: Required<Omit<PollingOptions, 'offset' | 'autoStart'>> = {
  interval: 300,
  timeout: 30,
  limit: 100
};

/**
 * Manages automatic long polling loop.
 * Fetches updates, tracks offset, and emits to callback.
 */
export class PollingManager {
  private running = false;
  private offset: number;
  private readonly interval: number;
  private readonly timeout: number;
  private readonly limit: number;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly api: ApiClient,
    private readonly onUpdates: (updates: Update[]) => void,
    private readonly onError: (error: PollingError) => void,
    options: PollingOptions = {}
  ) {
    this.interval = options.interval ?? DEFAULTS.interval;
    this.timeout = options.timeout ?? DEFAULTS.timeout;
    this.limit = options.limit ?? DEFAULTS.limit;
    this.offset = options.offset ?? 0;
  }

  /** Start polling loop */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.poll();
  }

  /** Stop polling loop gracefully */
  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /** Whether polling is currently active */
  get isRunning(): boolean {
    return this.running;
  }

  private async poll(): Promise<void> {
    if (!this.running) return;

    try {
      // Long polling timeout + 5s safety margin for network
      const httpTimeout = (this.timeout + 5) * 1000;

      const updates = await this.api.callWithTimeout<Update[]>(
        'getUpdates',
        {
          offset: this.offset,
          limit: this.limit,
          timeout: this.timeout
        },
        httpTimeout
      );

      if (updates && updates.length > 0) {
        // Move offset past the last received update
        const maxId = Math.max(...updates.map(u => u.update_id));
        this.offset = maxId + 1;

        this.onUpdates(updates);
      }
    } catch (err: unknown) {
      const pollingError = new PollingError(
        err instanceof Error ? err.message : String(err),
        err instanceof Error ? err : undefined
      );
      this.onError(pollingError);
    }

    // Schedule next poll
    if (this.running) {
      this.timer = setTimeout(() => this.poll(), this.interval);
    }
  }
}
