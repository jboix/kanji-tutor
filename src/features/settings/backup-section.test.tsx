import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BackupPort } from '../../domain/repos.ts';
import type { Settings } from '../../domain/types.ts';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import { fakeServices } from '../../test/render.tsx';
import { renderSettingsSection } from '../../test/settings-section.tsx';

type ImportJson = BackupPort['importJson'];

function setup(importJson = vi.fn<ImportJson>(async () => ({ ok: true }))) {
  const repos = createMemoryRepos({ settings: { currentLesson: 'Tobira 第3課' } });
  const exportJson = vi.fn(async () => '{"app":"kanji-tutor"}');
  const services = fakeServices({
    repos,
    backup: { exportJson, importJson, eraseAll: async () => undefined },
  });
  renderSettingsSection('backup', { services });
  return { repos, importJson, exportJson };
}

async function chooseFile(text: string) {
  const file = new File([text], 'kanji-reader-2026-W40.json', { type: 'application/json' });
  await userEvent.upload(await screen.findByLabelText('Import'), file);
}

describe('Backup (K7)', () => {
  beforeEach(() => {
    URL.createObjectURL = () => 'blob:backup';
    URL.revokeObjectURL = () => undefined;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it('exports a file and records the date', async () => {
    const { repos, exportJson } = setup();
    expect(await screen.findByText('No backup yet.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(exportJson).toHaveBeenCalledOnce();
    expect((await repos.settings.get()).lastBackupAt).toBeTypeOf('number');
    expect(await screen.findByText(/^Last backup /)).toBeTruthy();
  });

  it('asks before replacing, and does nothing on cancel', async () => {
    const { importJson } = setup();
    await chooseFile('{}');
    expect(screen.getByText(/This replaces your reading history on this device/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(importJson).not.toHaveBeenCalled();
  });

  it('imports after confirming and reloads the restored settings', async () => {
    const restored: Partial<Settings> = { currentLesson: 'Tobira 第4課', lastBackupAt: 1 };
    const { repos, importJson } = setup(
      vi.fn<ImportJson>(async () => {
        await repos.settings.patch(restored);
        return { ok: true };
      }),
    );
    await chooseFile('{"backup":true}');
    await userEvent.click(screen.getByRole('button', { name: 'Replace' }));
    expect(importJson).toHaveBeenCalledWith('{"backup":true}');
    expect((await screen.findByRole('status')).textContent).toBe('Backup restored.');
    // The list was read again: the restored backup date shows.
    expect(await screen.findByText(/^Last backup /)).toBeTruthy();
  });

  it('shows why a file was refused', async () => {
    const refuse = vi.fn<ImportJson>(async () => ({ ok: false, error: 'This file is not JSON.' }));
    setup(refuse);
    await chooseFile('nope');
    await userEvent.click(screen.getByRole('button', { name: 'Replace' }));
    expect((await screen.findByRole('alert')).textContent).toBe('This file is not JSON.');
  });
});
