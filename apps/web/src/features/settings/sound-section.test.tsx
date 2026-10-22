import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices } from '../../test/render.tsx';
import { renderSettingsSection } from '../../test/settings-section.tsx';

describe('Appearance → Sound (D125)', () => {
  it('is at full volume by default; all the way left is off, and back up turns it on', async () => {
    const repos = createMemoryRepos();
    renderSettingsSection('appearance', { services: fakeServices({ repos }) });
    expect(await screen.findByRole('group', { name: 'Theme' })).toBeTruthy();
    const knob = await screen.findByRole('slider', { name: 'Sound' });
    expect(knob.getAttribute('aria-valuetext')).toBe('100%');
    expect(screen.getByText(/the speaker buttons hide/)).toBeTruthy();
    fireEvent.change(knob, { target: { value: '0' } });
    await waitFor(async () => expect((await repos.settings.get()).sound).toBe(false));
    fireEvent.change(knob, { target: { value: '40' } });
    await waitFor(async () =>
      expect(await repos.settings.get()).toMatchObject({ sound: true, soundVolume: 0.4 }),
    );
  });

  it('is in French and Spanish too', async () => {
    renderSettingsSection('appearance', { services: fakeServices(), language: 'fr' });
    const knob = await screen.findByRole('slider', { name: 'Son' });
    expect(knob.getAttribute('aria-valuetext')).toBe('100 %');
  });
});
