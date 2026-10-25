import { Dexie } from 'dexie';
import { describe, expect, it } from 'vitest';
import type { LegacyCapture } from '../domain/scan-types.ts';
import { KanjiTutorDb } from './db.ts';
import { createDexieRepos } from './repos.ts';

const capture: LegacyCapture = {
  id: 'cap-1',
  createdAt: 3,
  photo: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }),
  lines: ['雨が降ります。', '明日は晴れるでしょう。'],
  lesson: 'Tobira 第4課',
  week: '2026-W42',
  addedItemIds: ['word:1358280'],
  sentenceIds: ['capture:cap-1:0', 'capture:cap-1:1'],
};

/** A database as schema v4 left it, holding one capture. */
async function v4Database(name: string) {
  const old = new Dexie(name);
  old.version(4).stores({ captures: 'id, createdAt', settings: 'key' });
  await old.table('captures').put(capture);
  old.close();
}

describe('the scanned lessons upgrade', () => {
  it('turns every capture into a scanned lesson of one page and drops the captures', async () => {
    await v4Database('migrate-captures');
    const db = new KanjiTutorDb('migrate-captures');
    const [lesson] = await createDexieRepos(db).scans.all();
    expect(lesson).toMatchObject({
      id: 'cap-1',
      createdAt: 3,
      title: '雨が降ります',
      lesson: 'Tobira 第4課',
      week: '2026-W42',
      addedItemIds: ['word:1358280'],
      unmatched: true,
    });
    expect(lesson?.pages[0]?.lines.map((line) => line.sentenceId)).toEqual(capture.sentenceIds);
    expect(new Uint8Array(await lesson!.pages[0]!.photo!.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3]),
    );
    expect(db.tables.map((table) => table.name)).not.toContain('captures');
    await db.delete();
  });
});
