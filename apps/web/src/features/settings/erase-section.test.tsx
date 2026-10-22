import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { EraseSection } from './erase-section.tsx';

function setup(eraseAll = vi.fn(async () => undefined)) {
  const restart = vi.fn();
  const base = fakeServices();
  const services = fakeServices({ repos: base.repos, backup: { ...base.backup, eraseAll } });
  renderWithServices(<EraseSection onExported={vi.fn()} restart={restart} />, { services });
  return { eraseAll, restart };
}

describe('EraseSection', () => {
  it('asks once, offers an export, then deletes everything and restarts', async () => {
    const { eraseAll, restart } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Delete all my data…' }));
    expect(eraseAll).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Export a backup first' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Delete everything' }));
    expect(eraseAll).toHaveBeenCalledTimes(1);
    expect(restart).toHaveBeenCalledTimes(1);
  });

  it('cancels without deleting', async () => {
    const { eraseAll } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Delete all my data…' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(eraseAll).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete all my data…' })).toBeTruthy();
  });

  it('says so when the browser blocks the deletion', async () => {
    const { restart } = setup(vi.fn(async () => Promise.reject(new Error('blocked'))));
    await userEvent.click(screen.getByRole('button', { name: 'Delete all my data…' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete everything' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Close other tabs');
    expect(restart).not.toHaveBeenCalled();
  });
});
