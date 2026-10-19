/**
 * Client-side rate limiting for Gemini (A14). A token bucket lets at most `perMinute` requests
 * through per rolling minute; requests beyond that wait in a queue (first in, first out) rather
 * than fire. After a 429 the limiter holds every request until Google's wait has passed: those
 * fail at once as a rate limit, without reaching Google, and are never retried automatically.
 */
import { DEFAULT_RETRY_MS, isRateLimit, retryDelayMs } from './errors.ts';

/** Requests per minute when nothing else is configured; the free tier allows about 10–15. */
export const REQUESTS_PER_MINUTE = 10;

const MINUTE_MS = 60_000;

/** Thrown while the limiter holds after a 429; maps to a `rate-limit` error with its wait. */
export class RateLimitHold extends Error {
  readonly status = 429;
  constructor(readonly retryAfterMs: number) {
    super('Waiting for the rate limit to reset.');
    this.name = 'RateLimitHold';
  }
}

export interface RateLimiter {
  /** Resolves when a request may go out; rejects with `RateLimitHold` during a hold. */
  take(signal?: AbortSignal): Promise<void>;
  /** Looks at a provider error and holds after a 429 for the wait it names. */
  noteError(error: unknown): void;
  /** Epoch ms until which requests are held (0 when not holding). */
  heldUntil(): number;
}

export interface LimiterOptions {
  perMinute?: number;
  now?: () => number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

function abortError(): Error {
  const error = new Error('The request was cancelled.');
  error.name = 'AbortError';
  return error;
}

/** `setTimeout` as a promise that rejects when `signal` aborts. */
export function sleepFor(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(abortError());
    });
  });
}

/** A token bucket of `perMinute` tokens, refilled continuously, with a FIFO queue. */
class TokenBucket implements RateLimiter {
  private readonly perMinute: number;
  private readonly rate: number;
  private readonly now: () => number;
  private readonly sleep: (ms: number, signal?: AbortSignal) => Promise<void>;
  private tokens: number;
  private at: number;
  private holdUntil = 0;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(options: LimiterOptions) {
    this.perMinute = options.perMinute ?? REQUESTS_PER_MINUTE;
    this.rate = this.perMinute / MINUTE_MS;
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? sleepFor;
    this.tokens = this.perMinute;
    this.at = this.now();
  }

  take(signal?: AbortSignal): Promise<void> {
    const turn = this.queue.then(() => this.acquire(signal));
    this.queue = turn.catch(() => undefined);
    return turn;
  }

  noteError(error: unknown): void {
    if (!isRateLimit(error) || error instanceof RateLimitHold) return;
    const wait = retryDelayMs(error) ?? DEFAULT_RETRY_MS;
    this.holdUntil = Math.max(this.holdUntil, this.now() + wait);
  }

  heldUntil(): number {
    return this.holdUntil > this.now() ? this.holdUntil : 0;
  }

  private refill(): void {
    const t = this.now();
    this.tokens = Math.min(this.perMinute, this.tokens + (t - this.at) * this.rate);
    this.at = t;
  }

  private async acquire(signal?: AbortSignal): Promise<void> {
    for (;;) {
      const left = this.holdUntil - this.now();
      if (left > 0) throw new RateLimitHold(left);
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      await this.sleep(Math.ceil((1 - this.tokens) / this.rate), signal);
    }
  }
}

/** A limiter of `perMinute` requests (default {@link REQUESTS_PER_MINUTE}). */
export function createRateLimiter(options: LimiterOptions = {}): RateLimiter {
  return new TokenBucket(options);
}

/** The limiter every real request of this app goes through. */
export const sharedLimiter: RateLimiter = createRateLimiter();

/** Runs one provider request through the limiter, holding after a 429. */
export async function limited<T>(
  limiter: RateLimiter | undefined,
  signal: AbortSignal | undefined,
  request: () => Promise<T>,
): Promise<T> {
  if (!limiter) return request();
  await limiter.take(signal);
  try {
    return await request();
  } catch (error) {
    limiter.noteError(error);
    throw error;
  }
}
