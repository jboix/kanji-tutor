/**
 * Installs the committed fixture pack (public/packs/fixture) into fake IndexedDB and checks the
 * v4 data: sentence levels and level-key queries, grammar, clusters, units and a language pack.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { PackManifest } from '../domain/repos.ts';
import type { Item } from '../domain/types.ts';
import { exportBackup } from './backup.ts';
import { KanjiReaderDb } from './db.ts';
import { createPackLoader } from './packs.ts';
import { createDexieRepos } from './repos.ts';

const DIR = resolve(import.meta.dirname, '../../public/packs/fixture');
const MANIFEST = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8')) as PackManifest;
const 待つ = '1410590';

function serveFixture(): void {
  vi.stubGlobal('fetch', async (url: string) => {
    const name = url.replace('/fixture/', '');
    return new Response(new Uint8Array(readFileSync(join(DIR, name))));
  });
}

let db: KanjiReaderDb;

beforeAll(async () => {
  serveFixture();
  db = new KanjiReaderDb('fixture-pack-test');
  // A learner's own point with a catalogue id, and progress on it, before the install.
  await db.grammar.put({
    id: 'desu',
    pattern: 'です (mine)',
    meaning: 'mine',
    exampleSentenceIds: [],
  });
  const item: Item = {
    id: 'grammar:desu',
    kind: 'grammar',
    ref: 'desu',
    level: 3,
    source: { kind: 'manual', week: '2026-W42', addedAt: 0 },
    updatedAt: 0,
  };
  await db.items.put(item);
  await createPackLoader(db, '/fixture/').install(() => undefined);
}, 60_000);

afterAll(async () => {
  vi.unstubAllGlobals();
  await db.delete();
});

describe('fixture pack v4', () => {
  it('gives every pack sentence a level and grammar ids', async () => {
    const all = await db.sentences.toArray();
    expect(all.length).toBe(
      MANIFEST.files.filter((f) => f.store === 'sentences').reduce((n, f) => n + f.count, 0),
    );
    expect(all.every((s) => s.level !== undefined && Array.isArray(s.grammarIds))).toBe(true);
    expect(all.some((s) => s.source === 'unit')).toBe(true);
  });

  it('finds sentences with a word at or below a level, easiest first', async () => {
    const repos = createDexieRepos(db);
    const every = await repos.sentences.containingWord(待つ);
    const gated = await repos.sentences.containingWord(待つ, { maxLevel: 4 });
    expect(every.length).toBeGreaterThan(0);
    expect(gated.every((s) => (s.level ?? 0) >= 4 && s.wordIds.includes(待つ))).toBe(true);
    expect(gated.length).toBe(every.filter((s) => (s.level ?? 0) >= 4).length);
    const levels = gated.map((s) => s.level ?? 0);
    expect(levels).toEqual([...levels].sort((a, b) => b - a));
    expect(gated[0]).not.toHaveProperty('levelKeys');
    expect(await repos.sentences.containingWord(待つ, { limit: 1 })).toHaveLength(1);
  });

  it('finds sentences that use a grammar point, and sentences of one level', async () => {
    const repos = createDexieRepos(db);
    const desu = await repos.sentences.withGrammar('desu', { maxLevel: 5, limit: 3 });
    expect(desu.length).toBeGreaterThan(0);
    expect(desu.every((s) => s.level === 5 && s.grammarIds?.includes('desu'))).toBe(true);
    const n5 = await repos.sentences.atLevel(5, 10);
    expect(n5.every((s) => s.level === 5)).toBe(true);
  });

  it('installs the N5 grammar points with examples and keeps the learner’s own point', async () => {
    const points = await db.grammar.toArray();
    const n5 = points.filter((p) => p.level === 5 && p.catalogue);
    expect(n5.length).toBeGreaterThan(60);
    expect(n5.every((p) => p.exampleSentenceIds.length > 0)).toBe(true);
    const mine = await db.grammar.get('desu');
    expect(mine).toMatchObject({ pattern: 'です (mine)', level: 5 });
    expect(mine?.catalogue).toBeUndefined();
    expect(mine?.exampleSentenceIds.length).toBeGreaterThan(0);
    expect(await db.items.get('grammar:desu')).toMatchObject({ level: 3 });
  });

  it('has clusters and units in path order', async () => {
    const repos = createDexieRepos(db);
    const n5 = await repos.clusters.byLevel(5);
    expect(n5.length).toBeGreaterThan(0);
    expect(n5.map((c) => c.order)).toEqual([...n5.map((c) => c.order)].sort((a, b) => a - b));
    const first = n5[0];
    expect(first && (await repos.clusters.ofWord(first.wordIds[0] ?? ''))).toContainEqual(first);
    const units = await repos.units.all();
    expect(units[0]).toMatchObject({ order: 1, level: 5 });
    expect(await repos.sentences.get(units[0]?.passageIds[0] ?? '')).toMatchObject({
      source: 'unit',
    });
  });

  it('installs a language pack on request and keeps it through an update', async () => {
    const loader = createPackLoader(db, '/fixture/');
    expect(await loader.installedLanguages?.()).toEqual([]);
    await loader.installLanguage?.('fr', () => undefined);
    const repos = createDexieRepos(db);
    const french = (await db.words.toArray()).filter((w) => w.glossesByLang?.fr);
    expect(french.length).toBe(MANIFEST.languages?.fr?.find((f) => f.store === 'glosses')?.count);
    expect((await repos.sentences.all()).some((s) => s.translations?.fr)).toBe(true);
    await db.settings.update('app', { packVersion: 'older' });
    await loader.install(() => undefined);
    expect((await db.words.toArray()).filter((w) => w.glossesByLang?.fr)).toHaveLength(
      french.length,
    );
    expect(await loader.installedLanguages?.()).toEqual(['fr']);
  }, 60_000);

  it('leaves pack sentences and level keys out of backups', async () => {
    const backup = await exportBackup(db);
    expect(backup.data.sentences).toEqual([]);
    expect(backup.data.settings).not.toHaveProperty('packLanguages');
  });
});
