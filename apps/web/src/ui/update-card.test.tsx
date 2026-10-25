import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { inLanguage, renderWithServices } from '../test/render.tsx';
import { BUILD, type NewVersion, offerUpdate, resetAppUpdate } from './app-update.ts';
import { BottomNav } from './bottom-nav.tsx';
import { UpdateCard } from './update-card.tsx';

const NEXT: NewVersion = {
  version: '1.5.0',
  notes: ['A verdict on Use it', 'Listening drills can wait'],
};

async function offer(next: NewVersion = NEXT, apply = vi.fn(async () => undefined)) {
  await offerUpdate(apply, async () => next);
  return apply;
}

const card = () => screen.getByRole('region', { name: 'A new version' });

describe('the new version card (N1e)', () => {
  afterEach(() => resetAppUpdate());

  it('shows nothing while no new version waits', () => {
    render(<UpdateCard place="home" />);
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('says which version, what it brings, and updates on Update now', async () => {
    const apply = await offer();
    render(<UpdateCard place="home" />);
    expect(card().textContent).toContain('A new version is ready');
    expect(card().textContent).toContain(`1.5.0 · you have ${BUILD.version}`);
    expect(
      within(card())
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(NEXT.notes);
    await userEvent.click(screen.getByRole('button', { name: 'Update now' }));
    expect(apply).toHaveBeenCalledOnce();
    expect(card().textContent).toContain('Updating to 1.5.0…');
    expect(card().textContent).toContain('The app reloads by itself in a moment');
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('hides on Home after Later, until a newer version, and Settings keeps it', async () => {
    await offer();
    render(
      <>
        <UpdateCard place="home" />
        <UpdateCard place="settings" />
      </>,
    );
    expect(screen.getAllByRole('region')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.getAllByRole('region')).toHaveLength(1);
    expect(card().textContent).toContain('1.5.0 is ready');
    expect(card().textContent).toContain('It installs by itself next time you open the app');
    await offer({ version: '1.6.0', notes: [] });
    expect(screen.getAllByRole('region')).toHaveLength(2);
  });

  it('hides with ✕ too', async () => {
    await offer();
    render(<UpdateCard place="home" />);
    await userEvent.click(screen.getByRole('button', { name: 'Not now, hide this' }));
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('still offers a version it could not describe', async () => {
    await offer({ notes: [] });
    render(inLanguage(<UpdateCard place="home" />, 'fr'));
    const french = screen.getByRole('region', { name: 'Une nouvelle version' });
    expect(french.textContent).toContain('Une nouvelle version est prête');
    expect(french.textContent).toContain(`Tu as ${BUILD.version}`);
    expect(within(french).queryByRole('list')).toBeNull();
  });

  it('marks Settings in the bar once Home stops offering it', async () => {
    await offer();
    renderWithServices(
      <>
        <UpdateCard place="home" />
        <BottomNav install={false} />
      </>,
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(screen.getByRole('link', { name: 'Settings, a new version is ready' })).toBeTruthy();
  });
});
