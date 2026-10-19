import type { AiError, AiErrorKind } from './types.ts';

/** A failed outcome inside the AI module; tasks return these instead of throwing. */
export interface Failure {
  ok: false;
  error: AiError;
}

/** Builds a failed result. */
export function failure(kind: AiErrorKind, message: string): Failure {
  return { ok: false, error: { kind, message } };
}

function statusOf(error: unknown): number | undefined {
  if (error === null || typeof error !== 'object' || !('status' in error)) return undefined;
  return typeof error.status === 'number' ? error.status : undefined;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

const KEY_STATUSES = new Set([400, 401, 403, 404]);

/** The wait used when a 429 names none (Google's per-minute quota resets within a minute). */
export const DEFAULT_RETRY_MS = 60_000;

/** "37s", "1.5s" (protobuf Duration JSON) in milliseconds. */
function durationMs(text: string | undefined): number | undefined {
  const seconds = text === undefined ? Number.NaN : Number.parseFloat(text);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds * 1000) : undefined;
}

function headerValue(error: object): string | undefined {
  if (!('headers' in error)) return undefined;
  const headers = error.headers as { get?: (name: string) => string | null } | undefined;
  return typeof headers?.get === 'function' ? (headers.get('retry-after') ?? undefined) : undefined;
}

/** A wait the error already carries: our own hold, or a Retry-After header (seconds). */
function carriedDelay(error: unknown): number | undefined {
  if (error === null || typeof error !== 'object') return undefined;
  if ('retryAfterMs' in error && typeof error.retryAfterMs === 'number') return error.retryAfterMs;
  const header = headerValue(error);
  return header && /^\d+(\.\d+)?$/.test(header.trim()) ? durationMs(header) : undefined;
}

/**
 * How long Google asks us to wait after a 429, in ms: `RetryInfo.retryDelay` in the error
 * details (the SDK puts the JSON body in the message), a `Retry-After` header, or the "Please
 * retry in 37.2s" hint in the message. Undefined when the error names no wait.
 */
export function retryDelayMs(error: unknown): number | undefined {
  const carried = carriedDelay(error);
  if (carried !== undefined) return carried;
  const message = messageOf(error);
  const info = /"retryDelay"\s*:\s*"([\d.]+)s"/.exec(message)?.[1];
  const hint = /retry in ([\d.]+)\s*s/i.exec(message)?.[1];
  return durationMs(info ?? hint);
}

/** True for HTTP 429 or `RESOURCE_EXHAUSTED`. */
export function isRateLimit(error: unknown): boolean {
  return statusOf(error) === 429 || /RESOURCE_EXHAUSTED|\b429\b/.test(messageOf(error));
}

/**
 * Maps whatever a provider threw to an `AiError`: HTTP 429 or `RESOURCE_EXHAUSTED` is
 * `rate-limit`, with the wait Google asked for (A14); everything else is `provider`.
 */
export function mapProviderError(error: unknown): AiError {
  const status = statusOf(error);
  const message = messageOf(error);
  if (isRateLimit(error)) {
    return {
      kind: 'rate-limit',
      message: 'The tutor needs a minute: Gemini is limiting requests for this key.',
      retryAfterMs: retryDelayMs(error) ?? DEFAULT_RETRY_MS,
    };
  }
  if (isAbort(error)) {
    return { kind: 'provider', code: 'cancelled', message: 'The request was cancelled.' };
  }
  if (status !== undefined && KEY_STATUSES.has(status)) {
    return {
      kind: 'provider',
      code: 'refused',
      status,
      message: `Gemini refused the request (${status}). Check the key and model in Settings.`,
    };
  }
  if (!message) return { kind: 'provider', code: 'no-answer', message: 'Gemini did not answer.' };
  return { kind: 'provider', message };
}
