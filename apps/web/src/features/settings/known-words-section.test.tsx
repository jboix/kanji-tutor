import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices } from '../../test/render.tsx';
import { renderSettingsSection } from '../../test/settings-section.tsx';

describe('Level and known words settings', () => {
  it('sets the learner level, N5 by default (P4)', async () => {
    const repos = createMemoryRepos();
    renderSettingsSection('words', { services: fakeServices({ repos }) });
    const group = await screen.findByRole('group', { name: 'Your level' });
    expect(within(group).getByLabelText('N5')).toHaveProperty('checked', true);
    await userEvent.click(within(group).getByLabelText('N3'));
    expect((await repos.settings.get()).learnerLevel).toBe(3);
    expect(screen.getByRole('link', { name: "What you've learned" }).getAttribute('href')).toBe(
      '/learned',
    );
  });
});
