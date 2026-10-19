import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices } from '../../test/render.tsx';
import { renderSettingsSection } from '../../test/settings-section.tsx';

describe('Settings → Explanations in (M1)', () => {
  it('starts on Auto, says what Auto means now, and stores a fixed choice', async () => {
    const repos = createMemoryRepos();
    renderSettingsSection('language', { services: fakeServices({ repos }) });
    const group = await screen.findByRole('group', { name: 'Explanations in' });
    expect(within(group).getByLabelText('Auto')).toHaveProperty('checked', true);
    expect(await screen.findByText(/At N5 right now, explanations come in English/)).toBeTruthy();
    await userEvent.click(within(group).getByLabelText('Japanese'));
    expect((await repos.settings.get()).immersion).toBe('japanese');
    await userEvent.click(within(group).getByLabelText('Mixed'));
    expect((await repos.settings.get()).immersion).toBe('mixed');
    await userEvent.click(within(group).getByLabelText('My language'));
    expect((await repos.settings.get()).immersion).toBe('native');
  });

  it('offers Find my level next to the level', async () => {
    renderSettingsSection('words', { services: fakeServices() });
    const link = await screen.findByRole('link', { name: 'Find my level' });
    expect(link.getAttribute('href')).toBe('/placement');
  });
});
