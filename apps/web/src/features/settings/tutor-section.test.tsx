import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices } from '../../test/render.tsx';
import { renderSettingsSection } from '../../test/settings-section.tsx';

describe('Settings → Tutor (A13)', () => {
  it('runs the tutor only when asked by default, and can explain mistakes automatically', async () => {
    const repos = createMemoryRepos();
    renderSettingsSection('tutor', { services: fakeServices({ repos }) });
    const group = await screen.findByRole('group', { name: 'Tutor' });
    expect(within(group).getByLabelText('Only when I ask')).toHaveProperty('checked', true);
    await userEvent.click(within(group).getByLabelText('Also explain my mistakes automatically'));
    expect((await repos.settings.get()).tutor).toBe('auto-mistakes');
    await userEvent.click(within(group).getByLabelText('Only when I ask'));
    expect((await repos.settings.get()).tutor).toBe('on-ask');
  });
});
