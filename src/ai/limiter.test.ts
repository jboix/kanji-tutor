import { describe, expect, it } from 'vitest';
import { createRateLimiter, limited, RateLimitHold, REQUESTS_PER_MINUTE } from './limiter.ts';

/** A clock that only moves when the limiter sleeps. */
function fakeClock() {
  const clock = { t: 0, slept: [] as number[] };
  const now = () => clock.t;
  const sleep = async (ms: number) => {
    clock.slept.push(ms);
    clock.t += ms;
  };
  return { clock, now, sleep };
}

const RETRY_BODY = JSON.stringify({
  error: {
    code: 429,
    status: 'RESOURCE_EXHAUSTED',
    details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '37s' }],
  },
});

describe('createRateLimiter', () => {
  it('lets 10 requests a minute through by default, then queues the next', async () => {
    const { clock, now, sleep } = fakeClock();
    const limiter = createRateLimiter({ now, sleep });
    expect(REQUESTS_PER_MINUTE).toBe(10);
    for (let i = 0; i < 10; i++) await limiter.take();
    expect(clock.slept).toEqual([]);
    await limiter.take();
    expect(clock.slept).toEqual([6000]);
  });

  it('serves waiting requests first in, first out', async () => {
    const { now, sleep } = fakeClock();
    const limiter = createRateLimiter({ perMinute: 1, now, sleep });
    const order: number[] = [];
    await Promise.all([1, 2, 3].map((n) => limiter.take().then(() => order.push(n))));
    expect(order).toEqual([1, 2, 3]);
  });

  it('holds every request after a 429 for the wait Google returned, and never retries', async () => {
    const { clock, now, sleep } = fakeClock();
    const limiter = createRateLimiter({ now, sleep });
    let calls = 0;
    const quota = Object.assign(new Error(RETRY_BODY), { status: 429 });
    const fail = () => {
      calls += 1;
      return Promise.reject(quota);
    };
    await expect(limited(limiter, undefined, fail)).rejects.toBe(quota);
    expect(limiter.heldUntil()).toBe(37_000);
    const held = limited(limiter, undefined, fail);
    await expect(held).rejects.toBeInstanceOf(RateLimitHold);
    await expect(held).rejects.toMatchObject({ status: 429, retryAfterMs: 37_000 });
    expect(calls).toBe(1);
    clock.t = 37_000;
    expect(limiter.heldUntil()).toBe(0);
    await limiter.take();
  });

  it('ignores other errors', async () => {
    const { now, sleep } = fakeClock();
    const limiter = createRateLimiter({ now, sleep });
    limiter.noteError(Object.assign(new Error('bad'), { status: 400 }));
    expect(limiter.heldUntil()).toBe(0);
  });

  it('stops waiting when the request is cancelled', async () => {
    const limiter = createRateLimiter({ perMinute: 1 });
    await limiter.take();
    const controller = new AbortController();
    const waiting = limiter.take(controller.signal);
    controller.abort();
    await expect(waiting).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('runs a request directly without a limiter', async () => {
    expect(await limited(undefined, undefined, async () => 'ok')).toBe('ok');
  });
});
