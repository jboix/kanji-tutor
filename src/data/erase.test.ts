import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';
import { createBackupPort } from './backup-port.ts';
import { KanjiReaderDb } from './db.ts';
import { createDexieRepos } from './repos.ts';

describe('eraseAll', () => {
  it('deletes the database, the key and local storage, so a new start is empty', async () => {
    const name = `erase-${crypto.randomUUID()}`;
    const db = new KanjiReaderDb(name);
    const repos = createDexieRepos(db);
    await repos.settings.patch({ apiKey: 'secret-key', onboarded: true, learnerLevel: 4 });
    localStorage.setItem('kanji-reader:intro-seen', '["word:1"]');
    sessionStorage.setItem('draft', 'x');

    await createBackupPort(db).eraseAll();

    expect(await Dexie.exists(name)).toBe(false);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    const fresh = createDexieRepos(new KanjiReaderDb(name));
    const settings = await fresh.settings.get();
    expect(settings.apiKey).toBeUndefined();
    expect(settings.onboarded).toBe(false);
  });
});
