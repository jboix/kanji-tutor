// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readConfig } from '../src/config.ts';
import { createLimiter } from '../src/rate-limit.ts';

const from = (ip: string) =>
  new Request('https://sync.test/pair/start', {
    headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` },
  });

describe('the limit for requests without an account', () => {
  it('allows the limit per client per minute, then answers 429 until the minute is over', () => {
    const clock = { now: 0 };
    const limit = createLimiter(2, () => clock.now);
    limit(from('1.1.1.1'));
    limit(from('1.1.1.1'));
    expect(() => limit(from('1.1.1.1'))).toThrow(expect.objectContaining({ status: 429 }));
    limit(from('2.2.2.2'));
    clock.now += 60_000;
    expect(() => limit(from('1.1.1.1'))).not.toThrow();
  });
});

describe('the server settings', () => {
  const key = btoa(String.fromCharCode(...new Uint8Array(32)));

  it('reads the origin, derives the passkey host and the invite link, and refuses a bad key', () => {
    const config = readConfig({ APP_ORIGIN: 'https://app.kanjitutor.ch', SAVE_KEY: key });
    expect(config).toMatchObject({
      RP_ID: 'app.kanjitutor.ch',
      APP_URL: 'https://app.kanjitutor.ch/',
      DB_PATH: '/data/sync.db',
      PORT: 3000,
      SYNC_VERSION: 'dev',
    });
    expect(() => readConfig({ APP_ORIGIN: 'https://x.test', SAVE_KEY: 'short' })).toThrow(
      /SAVE_KEY/,
    );
  });

  it('has caps that suit invite-only use, each changeable in .env', () => {
    const app = { APP_ORIGIN: 'https://app.kanjitutor.ch', SAVE_KEY: key };
    expect(readConfig(app)).toMatchObject({
      RATE_PER_MINUTE: 120,
      SIGNED_OUT_PER_MINUTE: 20,
      SAVES_PER_HOUR: 120,
      MAX_BODY_KB: 64,
      MAX_SAVE_MB: 50,
      MAX_DEVICES: 20,
    });
    expect(readConfig({ ...app, SAVES_PER_HOUR: '30' }).SAVES_PER_HOUR).toBe(30);
    expect(() => readConfig({ ...app, MAX_DEVICES: '0' })).toThrow(/MAX_DEVICES/);
  });

  it('takes a passkey domain at or above the app, and nothing else', () => {
    const app = { APP_ORIGIN: 'https://app.kanjitutor.ch', SAVE_KEY: key };
    expect(readConfig({ ...app, RP_ID: 'kanjitutor.ch' }).RP_ID).toBe('kanjitutor.ch');
    expect(() => readConfig({ ...app, RP_ID: 'other.ch' })).toThrow(/RP_ID/);
    expect(() => readConfig({ ...app, RP_ID: 'tutor.ch' })).toThrow(/RP_ID/);
  });
});
