import { afterEach, describe, expect, it } from 'vitest';
import { item } from '../../test/cloud-saves.ts';
import { KanjiTutorDb } from '../db.ts';
import { watchChanges } from './changes.ts';

let db: KanjiTutorDb | undefined;
afterEach(async () => {
  await db?.delete();
});

describe('watching for changes to save', () => {
  it('hears writes to what a save holds, not to the AI cache, and not while muted', async () => {
    db = new KanjiTutorDb(`changes-${Math.random()}`);
    let changes = 0;
    let muted = false;
    watchChanges(
      db,
      () => {
        changes += 1;
      },
      () => muted,
    );
    await db.items.put(item('1', 1));
    await db.settings.put({ key: 'app', theme: 'dark' } as never);
    expect(changes).toBe(2);
    await db.aiCache.put({ hash: 'h', task: 'explainWord', value: {}, createdAt: 1 } as never);
    expect(changes).toBe(2);
    muted = true;
    await db.items.put(item('2', 1));
    expect(changes).toBe(2);
  });
});
