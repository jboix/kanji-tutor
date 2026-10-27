import { beforeEach, describe, expect, it } from 'vitest';
import { installErrorLog, recentErrors, recordError } from './error-log.ts';

describe('error log', () => {
  beforeEach(() => localStorage.clear());

  it('keeps the last twenty errors with where and when, and a short stack', () => {
    const error = new TypeError('x is undefined');
    error.stack = Array.from({ length: 10 }, (_, i) => `line ${i}`).join('\n');
    for (let i = 0; i < 21; i++) recordError(i === 20 ? error : `plain ${i}`, 'screen', i);
    const kept = recentErrors();
    expect(kept).toHaveLength(20);
    expect(kept[0]).toEqual({ at: 1, where: 'screen', message: 'plain 1' });
    expect(kept.at(-1)?.message).toBe('TypeError: x is undefined');
    expect(kept.at(-1)?.stack?.split('\n')).toHaveLength(6);
  });

  it('records uncaught errors and unhandled rejections', () => {
    const target = new EventTarget() as Window;
    installErrorLog(target);
    target.dispatchEvent(Object.assign(new Event('error'), { error: new Error('boom') }));
    const rejection = Object.assign(new Event('unhandledrejection'), { reason: 'nope' });
    target.dispatchEvent(rejection);
    expect(recentErrors().map((e) => [e.where, e.message])).toEqual([
      ['window', 'Error: boom'],
      ['promise', 'nope'],
    ]);
  });

  it('reads nothing from a damaged entry', () => {
    localStorage.setItem('kanji-reader:errors', '{');
    expect(recentErrors()).toEqual([]);
  });
});
