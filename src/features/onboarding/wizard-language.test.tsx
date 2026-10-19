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

describe('wizard language step (N7b, N9)', () => {
  it('switches to Spanish at once, offers the pack and saves the choice on Next', async () => {
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
    const install = await screen.findByRole('button', { name: 'Instalar significados en español' });
    expect(screen.getByText(/aún no están instalados \(2,1 MB\)/)).toBeTruthy();
    await userEvent.click(install);
    expect(vi.mocked(loader.installLanguage ?? vi.fn()).mock.calls[0]?.[0]).toBe('es');
    expect(await screen.findByText(/en español están instalados/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    await waitFor(async () => expect((await repos.settings.get()).uiLanguage).toBe('es'));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Cargar el diccionario' }),
    ).toBeTruthy();
  });
});
