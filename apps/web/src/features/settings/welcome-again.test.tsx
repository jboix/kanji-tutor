import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices } from '../../test/render.tsx';
import { paths } from '../../ui/paths.ts';
import { ServicesProvider } from '../../ui/services.tsx';
import { SettingsSectionScreen } from './settings-section-screen.tsx';

function setup(section: 'language' | 'about') {
  const repos = createMemoryRepos({ settings: { onboarded: true, uiLanguage: 'fr' } });
  render(
    <ServicesProvider value={fakeServices({ repos })}>
      <MemoryRouter initialEntries={[paths.settingsSection(section)]}>
        <Routes>
          <Route path="/settings/:section" element={<SettingsSectionScreen />} />
          <Route path={paths.onboarding} element={<p>Welcome page</p>} />
        </Routes>
      </MemoryRouter>
    </ServicesProvider>,
  );
  return repos;
}

describe('Settings for what the wizard sets (P5)', () => {
  it('changes the explanation language (N7b)', async () => {
    const repos = setup('language');
    const french = await screen.findByRole('radio', { name: 'Français' });
    expect(french).toHaveProperty('checked', true);
    await userEvent.click(screen.getByRole('radio', { name: 'Español' }));
    expect((await repos.settings.get()).uiLanguage).toBe('es');
  });

  it('runs the welcome again from the start', async () => {
    const repos = setup('about');
    await userEvent.click(await screen.findByRole('button', { name: 'Run the welcome again' }));
    expect(await screen.findByText('Welcome page')).toBeTruthy();
    expect(await repos.settings.get()).toMatchObject({ onboarded: false, onboardingStep: '' });
  });
});
