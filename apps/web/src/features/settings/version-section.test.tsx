import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { inLanguage } from '../../test/render.tsx';
import { BUILD, setRegistration } from '../../ui/app-update.ts';
import { VersionSection } from './version-section.tsx';

describe('VersionSection (N1e)', () => {
  afterEach(() => setRegistration(undefined));

  it('shows the build and checks for an update on press', async () => {
    const update = vi.fn(async () => undefined);
    setRegistration({
      installing: null,
      waiting: null,
      update,
    } as unknown as ServiceWorkerRegistration);
    render(<VersionSection />);
    expect(screen.getByText(new RegExp(BUILD.id))).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Check for updates' }));
    expect(await screen.findByRole('status')).toHaveProperty(
      'textContent',
      'This is the latest version.',
    );
    expect(update).toHaveBeenCalledOnce();
  });

  it('says when updates are not available, in French too', async () => {
    render(inLanguage(<VersionSection />, 'fr'));
    await userEvent.click(screen.getByRole('button', { name: 'Chercher une mise à jour' }));
    expect((await screen.findByRole('status')).textContent).toContain('Pas de mises à jour ici');
    expect(screen.getByRole('button', { name: 'Recharger à neuf' })).toBeTruthy();
  });
});
