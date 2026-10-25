import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { ScannedLesson } from '../domain/scan-types.ts';
import type { Item, Review, Sentence } from '../domain/types.ts';
import { exportBackup, importBackup, parseBackup } from './backup.ts';
import { KanjiTutorDb } from './db.ts';
import { createDexieRepos } from './repos.ts';

const source = { kind: 'textbook', lesson: 'Tobira 第4課', week: '2026-W42', addedAt: 1 } as const;
const item: Item = {
  id: 'word:1358280',
  kind: 'word',
  ref: '1358280',
  level: 3,
  card: {
    due: 10,
    stability: 1,
    difficulty: 5,
    elapsedDays: 0,
    scheduledDays: 1,
    learningSteps: 0,
    reps: 1,
    lapses: 0,
    state: 1,
  },
  source,
  updatedAt: 2,
};
const review: Review = {
  at: 5,
  itemId: 'word:1358280',
  answer: 'もって',
  expected: 'まって',
  verdict: 'wrong',
  errorType: 'wrong-kanji',
  durationMs: 4000,
  mode: 'typed',
};
const sentence = (id: string, kind: Sentence['source']): Sentence => ({
  id,
  text: '駅で友達を待っている。',
  source: kind,
  tokens: [{ surface: '駅', reading: 'えき', base: '駅', pos: 'noun', wordId: '1', start: 0 }],
  wordIds: ['1'],
  verified: true,
});
const photo = () => new Blob([new Uint8Array([1, 2, 3, 250])], { type: 'image/jpeg' });
const scan: ScannedLesson = {
  id: 'scan-1',
  createdAt: 3,
  updatedAt: 4,
  title: 'Weather and plans',
  suggestedTitle: 'Weather',
  week: '2026-W42',
  pages: [
    {
      photo: photo(),
      kind: 'handout',
      read: true,
      lines: [{ text: '雨が降り＿＿です。', verified: false, sentenceId: 'c1' }],
    },
    { kind: 'reading', lines: [] },
  ],
  items: [
    { kind: 'kanji', text: '雨', ref: '雨', page: 0, from: 'tutor' },
    {
      kind: 'word',
      text: '雪見日和',
      page: 0,
      from: 'tutor',
      meaning: 'a fine day for viewing snow',
      reading: { surface: '雪見日和', reading: 'ゆきみびより', verified: false },
    },
  ],
  questions: [
    {
      id: '0-1',
      page: 0,
      type: 'choose-form',
      stem: '雨が降り＿＿です。',
      choices: ['そう', 'よう'],
      answer: 'そう',
      answerVerified: true,
      explanation: 'そう joins the ます stem.',
      readings: [],
      practises: ['kanji:雨'],
    },
  ],
  practised: { 'kanji:雨': 9 },
};

let db: KanjiTutorDb;
let name = 0;

beforeEach(async () => {
  name += 1;
  db = new KanjiTutorDb(`backup-test-${name}`);
  const repos = createDexieRepos(db);
  await repos.items.put(item);
  await repos.reviews.add({ ...review });
  await repos.sentences.putMany([sentence('t1', 'tatoeba'), sentence('c1', 'capture')]);
  await repos.scans.put(scan);
  await repos.settings.patch({ apiKey: 'secret-key', currentLesson: 'Tobira 第4課' });
});

afterEach(async () => {
  await db.delete();
});

describe('backup (K7)', () => {
  it('round-trips all user data through JSON into a fresh database', async () => {
    const file = JSON.parse(JSON.stringify(await exportBackup(db, 99)));
    const parsed = parseBackup(file);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const fresh = new KanjiTutorDb(`backup-fresh-${name}`);
    await importBackup(fresh, parsed.backup);
    const repos = createDexieRepos(fresh);
    expect(await repos.items.get('word:1358280')).toEqual(item);
    expect((await repos.reviews.all()).map(({ id: _id, ...rest }) => rest)).toEqual([review]);
    expect((await repos.sentences.all()).map((row) => row.id)).toEqual(['c1']);
    const restored = await repos.scans.get('scan-1');
    const { pages, ...rest } = restored ?? scan;
    const { pages: _pages, ...expected } = scan;
    expect(rest).toEqual(expected);
    expect(pages.map(({ photo: _photo, ...page }) => page)).toEqual(
      scan.pages.map(({ photo: _photo, ...page }) => page),
    );
    expect(new Uint8Array(await pages[0]!.photo!.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3, 250]),
    );
    expect(pages[1]?.photo).toBeUndefined();
    expect((await repos.settings.get()).currentLesson).toBe('Tobira 第4課');
    await fresh.delete();
  });

  it('never exports the API key and keeps the current one on import', async () => {
    const backup = await exportBackup(db);
    expect(JSON.stringify(backup)).not.toContain('secret-key');
    await importBackup(db, backup);
    expect((await createDexieRepos(db).settings.get()).apiKey).toBe('secret-key');
  });

  it('neither exports nor imports the dictionary pack version', async () => {
    await createDexieRepos(db).settings.patch({ packVersion: 'v1' });
    const backup = await exportBackup(db);
    expect(JSON.stringify(backup)).not.toContain('"packVersion"');
    const fresh = new KanjiTutorDb(`backup-packs-${name}`);
    const old = {
      ...backup,
      data: { ...backup.data, settings: { ...backup.data.settings, packVersion: 'v1' } },
    };
    await importBackup(fresh, old);
    expect((await createDexieRepos(fresh).settings.get()).packVersion).toBeUndefined();
    await fresh.delete();
  });

  it('keeps Tatoeba sentences, which come from the packs', async () => {
    await importBackup(db, await exportBackup(db));
    expect((await db.sentences.toArray()).map((row) => row.id).sort()).toEqual(['c1', 't1']);
  });

  it('writes the Kanji Tutor app id and still imports Kanji Reader backups (B1)', async () => {
    const backup = await exportBackup(db);
    expect(backup.app).toBe('kanji-tutor');
    const old = parseBackup(JSON.parse(JSON.stringify({ ...backup, app: 'kanji-reader' })));
    expect(old.ok).toBe(true);
    if (!old.ok) return;
    const fresh = new KanjiTutorDb(`backup-old-${name}`);
    await importBackup(fresh, old.backup);
    expect(await createDexieRepos(fresh).items.get('word:1358280')).toEqual(item);
    await fresh.delete();
  });

  it('imports the captures of a file made before scanned lessons as lessons of one page', async () => {
    const backup = JSON.parse(JSON.stringify(await exportBackup(db)));
    const { scans: _scans, ...data } = backup.data;
    const capture = {
      id: 'cap-1',
      createdAt: 3,
      photo: 'data:image/jpeg;base64,AQID+g==',
      lines: ['日本には方言がある。'],
      week: '2026-W42',
      addedItemIds: ['word:1358280'],
      sentenceIds: ['c1'],
    };
    const old = parseBackup({ ...backup, data: { ...data, captures: [capture] } });
    if (!old.ok) throw new Error(old.error);
    const fresh = new KanjiTutorDb(`backup-captures-${name}`);
    await importBackup(fresh, old.backup);
    const lesson = await createDexieRepos(fresh).scans.get('cap-1');
    expect(lesson).toMatchObject({
      title: '日本には方言がある',
      unmatched: true,
      addedItemIds: ['word:1358280'],
      pages: [
        {
          kind: 'mixed',
          lines: [{ text: '日本には方言がある。', verified: true, sentenceId: 'c1' }],
        },
      ],
    });
    expect(new Uint8Array(await lesson!.pages[0]!.photo!.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3, 250]),
    );
    await fresh.delete();
  });

  it('rejects files that are not backups', () => {
    expect(parseBackup({ app: 'other' }).ok).toBe(false);
    const result = parseBackup({ app: 'kanji-reader', version: 1, exportedAt: 1, data: {} });
    expect(result.ok).toBe(false);
  });
});
