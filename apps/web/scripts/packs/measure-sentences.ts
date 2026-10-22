/**
 * `bun run packs:measure [fixture]`: installs a pack into fake IndexedDB and
 * times the two ways to fetch "sentences with this word at or below N4" (D40):
 * the `wordIds` multiEntry index filtered by level in JS, against one range of the `levelKeys`
 * index. Fake IndexedDB is slower than a browser's, so only the ratio matters.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Dexie looks for IndexedDB when it loads, so the fake goes in first.
const fake = await import('fake-indexeddb');
Object.assign(globalThis, { indexedDB: fake.indexedDB, IDBKeyRange: fake.IDBKeyRange });
const { KanjiTutorDb } = await import('../../src/data/db.ts');
const { createPackLoader } = await import('../../src/data/packs.ts');
const { createDexieRepos } = await import('../../src/data/repos.ts');

const ROOT = resolve(import.meta.dir, '..', '..');
const DIR = join(ROOT, 'public', 'packs', process.argv[2] === 'fixture' ? 'fixture' : '');
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

async function main(): Promise<void> {
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
