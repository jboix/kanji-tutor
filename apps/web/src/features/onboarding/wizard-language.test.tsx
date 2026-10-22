import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { PackLoader } from '../../domain/repos.ts';
import { readingRepos } from '../../test/reading-fixtures.ts';
import { fakeServices, inLanguage } from '../../test/render.tsx';
import { ServicesProvider } from '../../ui/services.tsx';
import { OnboardingScreen } from './onboarding-screen.tsx';

function packs(): PackLoader {
  const installed = new Set<string>();
  return {
    installed: async () => 'v1',
    manifest: async () => ({
      version: 'v1',
      files: [],
      languages: { es: [{ store: 'glosses', url: 'es.json.gz', bytes: 2_100_000, count: 9 }] },
    }),
    install: async () => undefined,
    installLanguage: vi.fn(async (language: 'fr' | 'es') => {
      installed.add(language);
    }),
    installedLanguages: async () => [...installed] as ('fr' | 'es')[],
  };
}

describe('wizard language step (N7b, N9, D136)', () => {
  it('switches to Spanish at once, and its meanings install on their own after Next', async () => {
    const repos = await readingRepos({ onboardingStep: 'language' });
    const loader = packs();
    render(
      <ServicesProvider value={fakeServices({ repos, packs: loader })}>
        {inLanguage(
          <MemoryRouter>
            <OnboardingScreen />
          </MemoryRouter>,
        )}
      </ServicesProvider>,
    );
    await screen.findByRole('heading', { level: 1, name: 'Your language' });
    await userEvent.click(screen.getByRole('radio', { name: 'Español' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Tu idioma' })).toBeTruthy();
    expect(document.documentElement.lang).toBe('es');
    // No button to find, and nothing announced: the meanings come on their own.
    expect(screen.queryByRole('button', { name: /Instalar/ })).toBeNull();
    expect(screen.queryByText(/significados en español/)).toBeNull();
    expect(loader.installLanguage).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(async () => expect((await repos.settings.get()).uiLanguage).toBe('es'));
    expect(
      await screen.findByRole('heading', { level: 1, name: '¿Cuál sabes leer?' }),
    ).toBeTruthy();
    await waitFor(() =>
      expect(vi.mocked(loader.installLanguage ?? vi.fn()).mock.calls[0]?.[0]).toBe('es'),
    );
    // It installs quietly: no line in the header, and no error.
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(/significados/)).toBeNull();
  });
});
