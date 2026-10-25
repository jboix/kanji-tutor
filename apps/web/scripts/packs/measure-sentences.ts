/**
 * `bun run packs:measure [fixture | previous | <directory>] [--stats]`: prints the quality of a
 * pack's sentences (the current pack by default; `sentence-stats.ts`: length per level, short
 * ones, focus words, casual forms). Then, unless `--stats`, it installs the pack into fake
 * IndexedDB and times the two ways to fetch "sentences with this word at or below N4": the
 * `wordIds` multiEntry index filtered by level in JS, against one range of the `levelKeys`
 * index. Fake IndexedDB is slower than a browser's, so only the ratio matters.
 */
import { readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { PackManifest } from '../../src/domain/repos.ts';
import type { Sentence, Word } from '../../src/domain/types.ts';
import { sentenceStats } from './sentence-stats.ts';

// Dexie looks for IndexedDB when it loads, so the fake goes in first.
const fake = await import('fake-indexeddb');
Object.assign(globalThis, { indexedDB: fake.indexedDB, IDBKeyRange: fake.IDBKeyRange });
const { KanjiTutorDb } = await import('../../src/data/db.ts');
const { createPackLoader } = await import('../../src/data/packs.ts');
const { createDexieRepos } = await import('../../src/data/repos.ts');

const ROOT = resolve(import.meta.dir, '..', '..');
const PACKS = join(ROOT, 'public', 'packs');
const ARG = process.argv.slice(2).find((arg) => !arg.startsWith('--')) ?? '';
const DIR = isAbsolute(ARG) ? ARG : join(PACKS, ARG);
const LIMIT = 20;

globalThis.fetch = (async (url: string) =>
  new Response(
    new Uint8Array(readFileSync(join(DIR, url.replace(/^\/packs\//, '')))),
  )) as typeof fetch;

async function time(label: string, run: () => Promise<number>): Promise<void> {
  const start = performance.now();
  const rows = await run();
  console.log(`  ${label}: ${(performance.now() - start).toFixed(0)} ms, ${rows} rows`);
}

/** Every record of one store, read straight from the pack files. */
function records<T>(manifest: PackManifest, store: string): T[] {
  return manifest.files
    .filter((file) => file.store === store)
    .flatMap((file) => JSON.parse(gunzipSync(readFileSync(join(DIR, file.url))).toString()) as T[]);
}

function printStats(): void {
  const manifest = JSON.parse(readFileSync(join(DIR, 'manifest.json'), 'utf8')) as PackManifest;
  const levels = new Map<string, JlptLevel>();
  for (const w of records<Word>(manifest, 'words')) if (w.jlpt) levels.set(w.id, w.jlpt);
  console.log(`pack ${manifest.version}`);
  const lines = sentenceStats(records<Sentence>(manifest, 'sentences'), (id) => levels.get(id));
  for (const line of lines) console.log(line);
}

async function main(): Promise<void> {
  printStats();
  if (process.argv.includes('--stats')) return;
  const db = new KanjiTutorDb(`measure-${Date.now()}`);
  const started = performance.now();
  await createPackLoader(db, '/packs/').install(() => undefined);
  console.log(
    `installed ${await db.sentences.count()} sentences in ${((performance.now() - started) / 1000).toFixed(1)} s`,
  );
  const counts = new Map<string, number>();
  await db.sentences.each((s) => {
    for (const id of s.wordIds) counts.set(id, (counts.get(id) ?? 0) + 1);
  });
  const top = [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([id]) => id);
  const repos = createDexieRepos(db);
  console.log(`50 most frequent words (${counts.get(top[0] ?? '')} sentences for the first):`);
  await time('wordIds index + level filter, all rows', async () => {
    let n = 0;
    for (const id of top) {
      const rows = await db.sentences.where('wordIds').equals(id).toArray();
      n += rows.filter((s) => (s.level ?? 0) >= 4).slice(0, LIMIT).length;
    }
    return n;
  });
  await time(`levelKeys range, limit ${LIMIT}`, async () => {
    let n = 0;
    for (const id of top)
      n += (await repos.sentences.containingWord(id, { maxLevel: 4, limit: LIMIT })).length;
    return n;
  });
  await time('levelKeys range, no limit', async () => {
    let n = 0;
    for (const id of top) n += (await repos.sentences.containingWord(id, { maxLevel: 4 })).length;
    return n;
  });
  await db.delete();
}

await main();
