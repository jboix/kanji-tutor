import { HttpError } from './http.ts';

/** Counts requests per client in fixed one-minute windows; a 429 past the limit. */
export type Limiter = (request: Request) => void;

const clientOf = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

/**
 * The client's address: Caddy, the only way in, puts it in X-Forwarded-For. In memory, since
 * one server process handles every request.
 */
export function createLimiter(perMinute: number, now: () => number = Date.now): Limiter {
  const windows = new Map<string, { start: number; count: number }>();
  const fresh = (client: string, at: number) => {
    if (windows.size > 10_000) windows.clear();
    windows.set(client, { start: at, count: 1 });
  };
  return (request) => {
    const client = clientOf(request);
    const at = now();
    const window = windows.get(client);
    if (!window || at - window.start >= 60_000) return fresh(client, at);
    window.count += 1;
    if (window.count > perMinute) throw new HttpError(429, 'slow-down');
  };
}
