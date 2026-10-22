import { afterEach, describe, expect, it, vi } from 'vitest';
import { isStaleChunk, RELOAD_GUARD_MS, reloadOnce } from './stale-chunks.ts';

describe('stale chunks after a new build', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('knows a failed dynamic import in Chrome, Safari and Firefox', () => {
    const messages = [
      'Failed to fetch dynamically imported module: http://localhost:4173/assets/settings-screen-x.js',
      'Importing a module script failed.',
      'error loading dynamically imported module: http://localhost/assets/a.js',
    ];
    for (const message of messages) expect(isStaleChunk(new Error(message))).toBe(true);
    expect(isStaleChunk(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isStaleChunk('Importing a module script failed.')).toBe(false);
  });

  it('reloads once, then not again within the guard, then again after it', () => {
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const reload = vi.fn();
    expect(reloadOnce(reload)).toBe(true);
    expect(reloadOnce(reload)).toBe(false);
    now.mockReturnValue(1_000_000 + RELOAD_GUARD_MS);
    expect(reloadOnce(reload)).toBe(true);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});
