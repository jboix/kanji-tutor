import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/defaults.ts';
import type { Settings } from '../domain/types.ts';
import { createMemoryRepos } from '../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../test/render.tsx';
import { BackupReminder } from './backup-reminder.tsx';
import {
  INSTALL_NOT_NOW_KEY,
  InstallBanner,
  type InstallBannerState,
  readNotNow,
  showsInstallBanner,
} from './install-banner.tsx';
import { captureInstallPrompt, installWay, resetInstallPrompt } from './install-prompt.ts';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID =
  'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Mobile Safari/537.36';
const FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0';

const onboarded: Settings = { ...DEFAULT_SETTINGS, onboarded: true };

function device(userAgent: string, standalone = false) {
  vi.stubGlobal('navigator', { ...navigator, userAgent, maxTouchPoints: 5, standalone });
}

/** A faked `beforeinstallprompt`, as Chromium fires it. */
function offerInstall(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const prompt = vi.fn(async () => undefined);
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt,
    userChoice: Promise.resolve({ outcome }),
  });
  act(() => {
    window.dispatchEvent(event);
  });
  return prompt;
}

function state(patch: Partial<InstallBannerState> = {}): InstallBannerState {
  return { way: installWay(), settings: onboarded, notNow: false, backupShown: false, ...patch };
}

afterEach(() => {
  resetInstallPrompt();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('showsInstallBanner (N1d)', () => {
  it('shows on an iPhone, an Android with the prompt, and a desktop browser', () => {
    device(IPHONE);
    expect(installWay()).toBe('ios');
    expect(showsInstallBanner(state())).toBe(true);
    device(ANDROID);
    captureInstallPrompt();
    offerInstall();
    expect(installWay()).toBe('prompt');
    expect(showsInstallBanner(state())).toBe(true);
    resetInstallPrompt();
    device(FIREFOX);
    expect(installWay()).toBe('menu');
    expect(showsInstallBanner(state())).toBe(true);
  });

  it('hides when standalone or installed', () => {
    device(IPHONE, true);
    expect(showsInstallBanner(state())).toBe(false);
    device(ANDROID);
    captureInstallPrompt();
    window.dispatchEvent(new Event('appinstalled'));
    expect(showsInstallBanner(state())).toBe(false);
  });

  it('hides in the welcome, once closed, after Not now and under the backup reminder', () => {
    device(IPHONE);
    expect(showsInstallBanner(state({ settings: undefined }))).toBe(false);
    expect(showsInstallBanner(state({ settings: DEFAULT_SETTINGS }))).toBe(false);
    const closed = { ...onboarded, installBannerClosed: true };
    expect(showsInstallBanner(state({ settings: closed }))).toBe(false);
    expect(showsInstallBanner(state({ notNow: true }))).toBe(false);
    expect(showsInstallBanner(state({ backupShown: true }))).toBe(false);
  });

  it('reads Not now from this app open, and survives blocked storage', () => {
    expect(readNotNow()).toBe(false);
    sessionStorage.setItem(INSTALL_NOT_NOW_KEY, '1');
    expect(readNotNow()).toBe(true);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readNotNow()).toBe(false);
    vi.restoreAllMocks();
  });
});

describe('InstallBanner (N1d)', () => {
  beforeEach(() => captureInstallPrompt());

  function setup(settings: Partial<Settings> = {}) {
    const repos = createMemoryRepos({ settings: { ...onboarded, ...settings } });
    renderWithServices(<InstallBanner />, { services: fakeServices({ repos }) });
    return repos;
  }

  it('gives the Share steps on iOS, and Close hides it for good', async () => {
    device(IPHONE);
    const repos = setup();
    expect(await screen.findByRole('img', { name: 'Share' })).toBeTruthy();
    expect(screen.getByText(/then Add to Home Screen/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: "Close, and don't offer again" }));
    await waitFor(() => expect(screen.queryByLabelText('Install the app')).toBeNull());
    expect((await repos.settings.get()).installBannerClosed).toBe(true);
  });

  it('offers the browser Install button where the prompt fired', async () => {
    device(ANDROID);
    const repos = setup();
    await screen.findByText(/Install app, or Add to Home screen/);
    const prompt = offerInstall('accepted');
    await userEvent.click(screen.getByRole('button', { name: 'Install' }));
    expect(prompt).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByLabelText('Install the app')).toBeNull());
    await waitFor(async () => expect((await repos.settings.get()).installBannerClosed).toBe(true));
  });

  it('hides until the next open on Not now', async () => {
    device(FIREFOX);
    const repos = setup();
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    expect(screen.queryByLabelText('Install the app')).toBeNull();
    expect(sessionStorage.getItem(INSTALL_NOT_NOW_KEY)).toBe('1');
    expect((await repos.settings.get()).installBannerClosed).toBeUndefined();
  });

  it('waits while the backup reminder shows: one banner at a time', async () => {
    device(IPHONE);
    const repos = createMemoryRepos({ settings: onboarded });
    await repos.reviews.add({
      at: Date.now() - 10 * 86_400_000,
      itemId: 'word:1',
      answer: 'えき',
      expected: 'えき',
      verdict: 'correct',
      durationMs: 3000,
      mode: 'typed',
    });
    const both = (
      <>
        <BackupReminder />
        <InstallBanner />
      </>
    );
    renderWithServices(both, { services: fakeServices({ repos }) });
    const later = await screen.findByRole('button', { name: 'Later' });
    expect(screen.queryByLabelText('Install the app')).toBeNull();
    await userEvent.click(later);
    expect(await screen.findByLabelText('Install the app')).toBeTruthy();
  });

  it('renders nothing once closed', async () => {
    device(IPHONE);
    const repos = setup({ installBannerClosed: true });
    await repos.settings.get();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByLabelText('Install the app')).toBeNull();
  });
});
