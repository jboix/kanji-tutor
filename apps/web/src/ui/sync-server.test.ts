import { afterEach, describe, expect, it, vi } from 'vitest';
import { syncServer } from './sync-server.ts';

afterEach(() => vi.unstubAllEnvs());

describe('the cloud-save server setting', () => {
  it('is off without VITE_SYNC_URL', () => {
    vi.stubEnv('VITE_SYNC_URL', '');
    expect(syncServer()).toBeNull();
  });

  it('takes an HTTPS address, as its origin, or localhost for development', () => {
    vi.stubEnv('VITE_SYNC_URL', ' https://api.example.com/ ');
    expect(syncServer()).toBe('https://api.example.com');
    vi.stubEnv('VITE_SYNC_URL', 'http://localhost:3000');
    expect(syncServer()).toBe('http://localhost:3000');
  });

  it('stays off for plain HTTP elsewhere, or something that is not an address', () => {
    vi.stubEnv('VITE_SYNC_URL', 'http://api.example.com');
    expect(syncServer()).toBeNull();
    vi.stubEnv('VITE_SYNC_URL', 'api.example.com');
    expect(syncServer()).toBeNull();
  });
});
