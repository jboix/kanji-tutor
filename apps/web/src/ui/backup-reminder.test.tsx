import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS } from '../domain/defaults.ts';
import type { Item, Settings } from '../domain/types.ts';
import { translator } from '../test/i18n.ts';
import { createMemoryRepos } from '../test/memory-repos.ts';
import { fakeServices, renderWithServices } from '../test/render.tsx';
import {
  BackupReminder,
  backupFileName,
  backupReminderText,
  needsBackupReminder,
} from './backup-reminder.tsx';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 9, 17, 12);
const base: Settings = { ...DEFAULT_SETTINGS, onboarded: true };

describe('needsBackupReminder (N5)', () => {
  const OLD = NOW - 10 * DAY;
  const cases: [string, Partial<Settings>, number | undefined, boolean][] = [
    ['no reading history yet', {}, undefined, false],
    ['never backed up, reading for 3 days', {}, NOW - 3 * DAY, false],
    ['not onboarded', { onboarded: false }, OLD, false],
    ['never backed up', {}, OLD, true],
    ['backed up 29 days ago', { lastBackupAt: NOW - 29 * DAY }, OLD, false],
    ['backed up 30 days ago', { lastBackupAt: NOW - 30 * DAY }, OLD, true],
    ['backed up 34 days ago', { lastBackupAt: NOW - 34 * DAY }, OLD, true],
    ['snoozed until tomorrow', { backupReminderSnoozedUntil: NOW + DAY }, OLD, false],
    ['snooze ended', { backupReminderSnoozedUntil: NOW - 1 }, OLD, true],
    [
      'snooze ended, recent backup',
      { backupReminderSnoozedUntil: NOW - 1, lastBackupAt: NOW - DAY },
      OLD,
      false,
    ],
  ];
  it.each(cases)('%s', (_name, patch, since, expected) => {
    expect(needsBackupReminder({ ...base, ...patch }, NOW, since)).toBe(expected);
  });

  it('says how long ago, calmly', () => {
    const t = translator();
    expect(backupReminderText(t, { ...base, lastBackupAt: NOW - 34 * DAY }, NOW)).toBe(
      'Your last backup was 34 days ago. Export one now?',
    );
    expect(backupReminderText(t, { ...base, lastBackupAt: NOW - DAY }, NOW)).toBe(
      'Your last backup was 1 day ago. Export one now?',
    );
    expect(backupReminderText(t, base, NOW)).toBe('No backup yet. Export one now?');
    expect(backupReminderText(translator('fr'), base, NOW)).toContain('Aucune sauvegarde');
  });
});

const item: Item = {
  id: 'word:1',
  kind: 'word',
  ref: '1',
  level: 3,
  source: { kind: 'manual', week: '2026-W42', addedAt: 1 },
  updatedAt: 1,
};

async function setup(settings: Partial<Settings>) {
  const repos = createMemoryRepos({ settings: { ...base, ...settings } });
  await repos.items.put(item);
  await repos.reviews.add({
    at: NOW - 10 * DAY,
    itemId: item.id,
    answer: 'えき',
    expected: 'えき',
    verdict: 'correct',
    durationMs: 3000,
    mode: 'typed',
  });
  const exportJson = vi.fn(async () => '{"app":"kanji-tutor"}');
  const services = fakeServices({
    repos,
    backup: { exportJson, importJson: async () => ({ ok: true }), eraseAll: async () => undefined },
  });
  renderWithServices(<BackupReminder now={() => NOW} />, { services });
  return { repos, exportJson };
}

describe('backupFileName', () => {
  it('names the file after the app and the local date (B1)', () => {
    expect(backupFileName(new Date(2026, 0, 5, 9).getTime())).toBe(
      'kanji-tutor-backup-2026-01-05.json',
    );
  });
});

describe('BackupReminder', () => {
  beforeEach(() => {
    URL.createObjectURL = () => 'blob:backup';
    URL.revokeObjectURL = () => undefined;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('shows a calm line when a backup is due and exports on "Export now"', async () => {
    const { repos, exportJson } = await setup({ lastBackupAt: NOW - 34 * DAY });
    const line = await screen.findByText('Your last backup was 34 days ago. Export one now?');
    expect(line).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Export now' }));
    expect(exportJson).toHaveBeenCalledOnce();
    expect((await repos.settings.get()).lastBackupAt).toBe(NOW);
    await waitFor(() => expect(screen.queryByLabelText('Backup reminder')).toBeNull());
  });

  it('hides for a week on "Later"', async () => {
    const { repos } = await setup({});
    await userEvent.click(await screen.findByRole('button', { name: 'Later' }));
    expect((await repos.settings.get()).backupReminderSnoozedUntil).toBe(NOW + 7 * DAY);
    await waitFor(() => expect(screen.queryByLabelText('Backup reminder')).toBeNull());
  });

  it('renders nothing when the backup is recent', async () => {
    const { repos } = await setup({ lastBackupAt: NOW - DAY });
    await repos.settings.get();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByLabelText('Backup reminder')).toBeNull();
  });
});
