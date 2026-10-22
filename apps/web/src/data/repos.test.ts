import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { KanjiTutorDb } from './db.ts';
import { createDexieRepos } from './repos.ts';

let db: KanjiTutorDb;
let name = 0;

beforeEach(() => {
  name += 1;
  db = new KanjiTutorDb(`repos-test-${name}`);
});

afterEach(async () => {
  await db.delete();
});

describe('settings repo', () => {
  it('drops the API key from IndexedDB when it is patched to empty (N3)', async () => {
    const repos = createDexieRepos(db);
    await repos.settings.patch({ apiKey: 'secret-key', currentLesson: 'Tobira 第4課' });
    const next = await repos.settings.patch({ apiKey: '' });
    expect(next).not.toHaveProperty('apiKey');
    const row = await db.settings.get('app');
    expect(row).not.toHaveProperty('apiKey');
    expect(row?.currentLesson).toBe('Tobira 第4課');
  });

  it('keeps fields that concurrent patches set', async () => {
    const repos = createDexieRepos(db);
    await Promise.all([
      repos.settings.patch({ packVersion: 'v2' }),
      repos.settings.patch({ learnerLevel: 4 }),
      repos.settings.patch({ sound: false }),
    ]);
    expect(await repos.settings.get()).toMatchObject({
      packVersion: 'v2',
      learnerLevel: 4,
      sound: false,
    });
  });

  it('drops an emptied lesson tag (K5)', async () => {
    const repos = createDexieRepos(db);
    await repos.settings.patch({ currentLesson: 'Tobira 第4課' });
    expect(await repos.settings.patch({ currentLesson: '' })).not.toHaveProperty('currentLesson');
  });

  it('keeps the reminder snooze through a patch', async () => {
    const repos = createDexieRepos(db);
    await repos.settings.patch({ backupReminderSnoozedUntil: 42 });
    await repos.settings.patch({ theme: 'dark' });
    expect((await repos.settings.get()).backupReminderSnoozedUntil).toBe(42);
  });

  it('moves the retired default model to the new one and keeps other choices (A12)', async () => {
    const repos = createDexieRepos(db);
    await db.settings.put({
      ...(await repos.settings.get()),
      modelId: 'gemini-2.5-flash-lite',
      key: 'app',
    });
    expect((await repos.settings.get()).modelId).toBe('gemini-3.5-flash-lite');
    await repos.settings.patch({ modelId: 'gemini-2.5-flash' });
    expect((await repos.settings.get()).modelId).toBe('gemini-2.5-flash');
  });
});
