import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PackLoader } from '../../domain/repos.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { renderSettingsSection } from '../../test/settings-section.tsx';
import type { UiLanguage } from '../../ui/languages.ts';
import type { SettingsSectionId } from '../../ui/paths.ts';
import { SettingsScreen } from './settings-screen.tsx';

function setup(language: UiLanguage, section: SettingsSectionId, packs?: Partial<PackLoader>) {
  const repos = createMemoryRepos({ settings: { uiLanguage: language } });
  const base = fakeServices({ repos });
  const services = { ...base, packs: { ...base.packs, ...packs } };
  const view = renderSettingsSection(section, { services, language });
  return { repos, view, services };
}

describe('Settings in the learner language (N7b)', () => {
  it('renders the categories in French', async () => {
    const repos = createMemoryRepos({ settings: { uiLanguage: 'fr' } });
    renderWithServices(<SettingsScreen />, { services: fakeServices({ repos }), language: 'fr' });
    expect(await screen.findByRole('heading', { name: 'Réglages' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Tuteur IA/ }).getAttribute('href')).toBe(
      '/settings/tutor',
    );
    expect(screen.getByRole('link', { name: /Sauvegarde et stockage/ })).toBeTruthy();
  });

  it('renders the sub-screens in French', async () => {
    const { view } = setup('fr', 'tutor');
    expect(await screen.findByRole('heading', { name: 'Clé API Gemini' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Tester la clé, / })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Réglages' })).toBeTruthy();
    view.unmount();
    setup('fr', 'backup');
    expect(await screen.findByText('Pas encore de sauvegarde.')).toBeTruthy();
    setup('fr', 'appearance');
    expect(await screen.findByRole('radio', { name: 'Sombre' })).toBeTruthy();
  });

  it('renders in Spanish', async () => {
    const { view } = setup('es', 'tutor');
    expect(await screen.findByRole('heading', { name: 'Tutor IA' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Probar clave, / })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Solo cuando lo pido' })).toBeTruthy();
    view.unmount();
    setup('es', 'about');
    expect(await screen.findByRole('button', { name: 'Repetir la bienvenida' })).toBeTruthy();
  });

  it('switches the whole screen when another language is chosen', async () => {
    const { repos } = setup('en', 'language');
    await userEvent.click(await screen.findByRole('radio', { name: 'Français' }));
    expect(await screen.findByRole('heading', { name: 'Langue' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Français' })).toHaveProperty('checked', true);
    expect((await repos.settings.get()).uiLanguage).toBe('fr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('offers the language pack when it is missing, and installs it', async () => {
    const installLanguage = vi.fn(async (_language: string, _onProgress: unknown) => undefined);
    setup('fr', 'language', {
      installLanguage,
      installedLanguages: async () => [],
      manifest: async () => ({
        version: 'test',
        files: [],
        languages: { fr: [{ store: 'glosses', url: 'fr.json', bytes: 2_400_000, count: 1 }] },
      }),
    });
    expect(await screen.findByText(/ne sont pas encore installés \(2,4 Mo\)/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Installer les sens en français' }));
    expect(installLanguage.mock.calls[0]?.[0]).toBe('fr');
    expect(
      await screen.findByText('Les sens et les traductions en français sont installés.'),
    ).toBeTruthy();
  });
});
