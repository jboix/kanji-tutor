import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices } from '../../test/render.tsx';
import { renderSettingsSection } from '../../test/settings-section.tsx';

describe('Appearance → Sound (D125)', () => {
  it('is on by default, and turns off and on again', async () => {
    const repos = createMemoryRepos();
    renderSettingsSection('appearance', { services: fakeServices({ repos }) });
    expect(await screen.findByRole('group', { name: 'Theme' })).toBeTruthy();
    const group = await screen.findByRole('group', { name: 'Sound' });
    expect(within(group).getByLabelText('On')).toHaveProperty('checked', true);
    expect(screen.getByText(/the speaker buttons hide/)).toBeTruthy();
    await userEvent.click(within(group).getByLabelText('Off'));
    expect((await repos.settings.get()).sound).toBe(false);
    await userEvent.click(within(group).getByLabelText('On'));
    expect((await repos.settings.get()).sound).toBe(true);
  });

  it('is in French and Spanish too', async () => {
    renderSettingsSection('appearance', { services: fakeServices(), language: 'fr' });
    expect(await screen.findByRole('group', { name: 'Son' })).toBeTruthy();
  });
});
