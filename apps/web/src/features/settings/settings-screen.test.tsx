import { fireEvent, screen, within } from '@testing-library/react';
import { Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { resetInstallPrompt } from '../../ui/install-prompt.ts';
import { SETTINGS_SECTIONS } from '../../ui/paths.ts';
import { SettingsScreen } from './settings-screen.tsx';
import { SettingsSectionScreen } from './settings-section-screen.tsx';

function app(path: string) {
  const repos = createMemoryRepos({ settings: { sessionMinutes: 10, theme: 'dark' } });
  renderWithServices(
    <Routes>
      <Route path="/settings" element={<SettingsScreen />} />
      <Route path="/settings/:section" element={<SettingsSectionScreen />} />
    </Routes>,
    { services: fakeServices({ repos }), path },
  );
}

describe('Settings categories (IA5)', () => {
  it('lists every category with its detail, each opening its own screen', async () => {
    app('/settings');
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeTruthy();
    const links = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/settings/'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      SETTINGS_SECTIONS.map((id) => `/settings/${id}`),
    );
    const sessions = screen.getByRole('link', { name: /^Sessions/ });
    expect(await within(sessions).findByText('10 min · explain new things first')).toBeTruthy();
    expect(screen.getByRole('link', { name: /^Appearance/ }).textContent).toContain('Dark');
    // Every category's square is a line icon, never a kanji (D122).
    for (const link of links) expect(link.querySelector('svg')).toBeTruthy();
    expect(screen.getByRole('main').querySelector('[lang="ja"]')).toBeNull();
    // Settings is a tab: no install banner here (D68), and the tab is current.
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Settings' }).getAttribute('aria-current')).toBe(
      'page',
    );
  });

  it('says on Appearance when sound is off (D125)', async () => {
    const repos = createMemoryRepos({ settings: { theme: 'light', sound: false } });
    renderWithServices(<SettingsScreen />, {
      services: fakeServices({ repos }),
      path: '/settings',
    });
    const appearance = screen.getByRole('link', { name: /^Appearance/ });
    expect(await within(appearance).findByText('Light · Sound off')).toBeTruthy();
  });

  it('opens a category and goes back to the list', async () => {
    app('/settings');
    fireEvent.click(screen.getByRole('link', { name: /^Sessions/ }));
    expect(await screen.findByRole('heading', { name: 'Sessions' })).toBeTruthy();
    expect(await screen.findByRole('group', { name: 'Furigana' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findByRole('link', { name: /^Backup and storage/ })).toBeTruthy();
  });

  it('sends an unknown category to the list', async () => {
    app('/settings/nope');
    expect(await screen.findByRole('link', { name: /^AI tutor/ })).toBeTruthy();
  });

  describe('once installed (D121)', () => {
    afterEach(() => {
      resetInstallPrompt();
      vi.unstubAllGlobals();
    });
    const standalone = () => vi.stubGlobal('navigator', { ...navigator, standalone: true });

    it('drops Install from the list', () => {
      standalone();
      app('/settings');
      expect(screen.queryByRole('link', { name: /^Install/ })).toBeNull();
      expect(screen.getByRole('link', { name: /^About/ })).toBeTruthy();
    });

    it('sends a direct link to Install back to the list', async () => {
      standalone();
      app('/settings/install');
      expect(await screen.findByRole('heading', { name: 'Settings', level: 1 })).toBeTruthy();
      expect(screen.queryByRole('heading', { name: 'Install', level: 1 })).toBeNull();
    });

    it('keeps Install in a browser tab', () => {
      app('/settings');
      expect(screen.getByRole('link', { name: /^Install/ })).toBeTruthy();
    });
  });
});
