import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { inLanguage } from '../../test/render.tsx';
import { BUILD, offerUpdate, resetAppUpdate, setRegistration } from '../../ui/app-update.ts';
import { VersionSection } from './version-section.tsx';

describe('VersionSection (N1e)', () => {
  afterEach(() => {
    setRegistration(undefined);
    resetAppUpdate();
  });

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

  it('offers a waiting version with the newest number, and keeps Reload fresh apart', async () => {
    await offerUpdate(
      async () => undefined,
      async () => ({ version: '1.5.0', notes: [] }),
    );
    render(<VersionSection />);
    expect(screen.getByRole('region', { name: 'A new version' }).textContent).toContain(
      '1.5.0 is ready',
    );
    expect(screen.getByText('Newest').nextSibling?.textContent).toBe('1.5.0');
    expect(screen.queryByRole('button', { name: 'Check for updates' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Trouble updating?' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Reload fresh' })).toBeTruthy();
  });
});
