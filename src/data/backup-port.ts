import type { BackupPort } from '../domain/repos.ts';
import type { KanjiReaderDb } from './db.ts';
import { eraseLocalData } from './erase.ts';

/** Backup as JSON text for the Settings screen. Zod and the backup code load on first use. */
export function createBackupPort(db: KanjiReaderDb): BackupPort {
  return {
    exportJson: async () => {
      const { exportBackup } = await import('./backup.ts');
      return JSON.stringify(await exportBackup(db));
    },
    importJson: async (text) => {
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        return { ok: false, error: 'This file is not JSON.' };
      }
      const { importBackup, parseBackup } = await import('./backup.ts');
      const parsed = parseBackup(json);
      if (!parsed.ok) return { ok: false, error: `Not a Kanji Tutor backup (${parsed.error}).` };
      await importBackup(db, parsed.backup);
      return { ok: true };
    },
    eraseAll: () => eraseLocalData(db),
  };
}
