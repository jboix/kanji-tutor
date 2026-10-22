import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  captureInstallPrompt,
  installWay,
  isIos,
  isStandalone,
  promptInstall,
  resetInstallPrompt,
} from './install-prompt.ts';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';

/** A faked `beforeinstallprompt` with the outcome the user picks. */
function fakeInstallEvent(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const prompt = vi.fn(async () => undefined);
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  });
  return { event, prompt };
}

function stubDevice(userAgent: string, maxTouchPoints = 0, standalone = false) {
  vi.stubGlobal('navigator', { ...navigator, userAgent, maxTouchPoints, standalone });
}

describe('install prompt (N1b)', () => {
  afterEach(() => {
    resetInstallPrompt();
    vi.unstubAllGlobals();
  });

  it('tells iOS, iPadOS and other devices apart', () => {
    expect(isIos({ userAgent: IPHONE, maxTouchPoints: 5 } as Navigator)).toBe(true);
    expect(isIos({ userAgent: IPAD_DESKTOP, maxTouchPoints: 5 } as Navigator)).toBe(true);
    expect(isIos({ userAgent: IPAD_DESKTOP, maxTouchPoints: 0 } as Navigator)).toBe(false);
    expect(isIos({ userAgent: ANDROID, maxTouchPoints: 5 } as Navigator)).toBe(false);
  });

  it('offers the iOS steps on an iPhone and the menu elsewhere', () => {
    stubDevice(IPHONE, 5);
    expect(installWay()).toBe('ios');
    stubDevice(ANDROID, 5);
    expect(installWay()).toBe('menu');
  });

  it('counts as installed when running standalone', () => {
    stubDevice(IPHONE, 5, true);
    expect(isStandalone()).toBe(true);
    expect(installWay()).toBe('installed');
  });

  it('keeps the browser prompt for later and shows it once', async () => {
    stubDevice(ANDROID, 5);
    captureInstallPrompt();
    const { event, prompt } = fakeInstallEvent('accepted');
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(installWay()).toBe('prompt');
    expect(await promptInstall()).toBe(true);
    expect(prompt).toHaveBeenCalledOnce();
    expect(installWay()).toBe('installed');
    expect(await promptInstall()).toBe(false);
  });

  it('falls back to the menu when the prompt is dismissed', async () => {
    stubDevice(ANDROID, 5);
    captureInstallPrompt();
    window.dispatchEvent(fakeInstallEvent('dismissed').event);
    expect(await promptInstall()).toBe(false);
    expect(installWay()).toBe('menu');
  });

  it('marks the app installed when the browser says so', () => {
    stubDevice(ANDROID, 5);
    captureInstallPrompt();
    window.dispatchEvent(new Event('appinstalled'));
    expect(installWay()).toBe('installed');
  });
});
