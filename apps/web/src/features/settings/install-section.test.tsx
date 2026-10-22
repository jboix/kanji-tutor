import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { inLanguage } from '../../test/render.tsx';
import { captureInstallPrompt, resetInstallPrompt } from '../../ui/install-prompt.ts';
import { InstallSection } from './install-section.tsx';

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Version/18.0 Safari/604.1';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) Chrome/140.0 Mobile Safari/537.36';

function device(userAgent: string, standalone = false) {
  vi.stubGlobal('navigator', { ...navigator, userAgent, maxTouchPoints: 5, standalone });
}

function offerInstall(outcome: 'accepted' | 'dismissed') {
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

describe('InstallSection (N1b)', () => {
  afterEach(() => {
    resetInstallPrompt();
    vi.unstubAllGlobals();
  });

  it('shows an Install button once the browser offers one, and hides after installing', async () => {
    device(ANDROID);
    captureInstallPrompt();
    render(inLanguage(<InstallSection />));
    expect(screen.getByText(/Install app, or Add to Home screen/)).toBeTruthy();
    const prompt = offerInstall('accepted');
    await userEvent.click(screen.getByRole('button', { name: 'Install' }));
    expect(prompt).toHaveBeenCalledOnce();
    expect(screen.queryByRole('heading', { name: 'Install Kanji Tutor' })).toBeNull();
  });

  it('gives the Share steps on iOS, with the Share symbol named', () => {
    device(IPHONE);
    render(inLanguage(<InstallSection />, 'fr'));
    expect(screen.getByRole('heading', { name: 'Installer Kanji Tutor' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Partager' })).toBeTruthy();
    expect(screen.getByText(/Sur l’écran d’accueil/)).toBeTruthy();
  });

  it('is hidden when the app already runs from the home screen', () => {
    device(IPHONE, true);
    const { container } = render(inLanguage(<InstallSection />));
    expect(container.textContent).toBe('');
  });
});
