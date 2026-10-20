import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { endLaunch, FONT_WAIT_MS, MIN_LAUNCH_MS, WELCOMED_KEY } from './launch.ts';
import { applyTheme, THEME_KEY } from './theme.ts';

function launchScreen(): HTMLElement {
  const launch = document.createElement('div');
  launch.id = 'launch';
  document.body.append(launch);
  return launch;
}

/** jsdom has no FontFaceSet: give the document one whose `ready` is this promise. */
function fonts(ready: Promise<unknown>) {
  Object.defineProperty(document, 'fonts', { value: { ready }, configurable: true });
}

describe('the launch screen (N1c)', () => {
  afterEach(() => {
    document.getElementById('launch')?.remove();
    Reflect.deleteProperty(document, 'fonts');
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('fades and leaves the document once, then does nothing', async () => {
    vi.useFakeTimers();
    fonts(Promise.resolve());
    const launch = launchScreen();
    vi.spyOn(performance, 'now').mockReturnValue(100);
    endLaunch();
    // It waits out the minimum time before it fades (U12).
    expect(launch.dataset.done).toBe('pending');
    await vi.advanceTimersByTimeAsync(MIN_LAUNCH_MS - 100);
    expect(launch.dataset.done).toBe('');
    expect(launch.getAttribute('aria-hidden')).toBe('true');
    await vi.runAllTimersAsync();
    expect(document.getElementById('launch')).toBeNull();
    endLaunch();
  });

  it('holds for the fonts past the minimum, but no longer than the cap (D124)', async () => {
    vi.useFakeTimers();
    let loaded: () => void = () => undefined;
    fonts(new Promise<void>((resolve) => (loaded = resolve)));
    const launch = launchScreen();
    vi.spyOn(performance, 'now').mockReturnValue(MIN_LAUNCH_MS);
    endLaunch();
    await vi.advanceTimersByTimeAsync(100);
    expect(launch.dataset.done).toBe('pending');
    loaded();
    await vi.advanceTimersByTimeAsync(0);
    expect(launch.dataset.done).toBe('');
  });

  it('fades after the cap when a font never arrives', async () => {
    vi.useFakeTimers();
    fonts(new Promise(() => undefined));
    const launch = launchScreen();
    vi.spyOn(performance, 'now').mockReturnValue(MIN_LAUNCH_MS);
    endLaunch();
    await vi.advanceTimersByTimeAsync(FONT_WAIT_MS - 1);
    expect(launch.dataset.done).toBe('pending');
    await vi.advanceTimersByTimeAsync(1);
    expect(launch.dataset.done).toBe('');
  });

  it('mirrors the theme where index.html reads it before the first paint', () => {
    applyTheme('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
    applyTheme('system');
    expect(localStorage.getItem(THEME_KEY)).toBeNull();
  });
});

describe('index.html', () => {
  it('reads the same storage keys as the app, before the first paint (N1c, D138)', () => {
    const html = readFileSync(resolve(import.meta.dirname, '..', '..', 'index.html'), 'utf8');
    expect(html).toContain(`'${THEME_KEY}'`);
    expect(html).toContain(`'${WELCOMED_KEY}'`);
  });
});
