/**
 * Dictionary lookups kept in memory. The packs only change when one is installed, while a single
 * screen asks for the same entries many times over (the lesson path reads every unit word, a
 * session checks each sentence's words), and every IndexedDB read is a round trip. The entries
 * are shared between callers, which only read them.
 */
import type { DictionaryRepo } from '../domain/repos.ts';
import type { Kanji, Word } from '../domain/types.ts';
import type { KanjiTutorDb } from './db.ts';

/** Each entry is a promise, so lookups running side by side share one read. */
interface Cache {
  words: Map<string, Promise<Word | undefined>>;
  kanji: Map<string, Promise<Kanji | undefined>>;
  lists: Map<string, Promise<readonly unknown[]>>;
}

/**
 * Past this many entries a map starts over, so memory stays bounded: a few thousand words and
 * kanji (a screen needs hundreds), and the lists, of which the JLPT ones are the largest.
 */
const LIMIT = { words: 6_000, kanji: 3_000, lists: 500 };

const caches = new WeakMap<KanjiTutorDb, Cache>();

function cacheOf(db: KanjiTutorDb): Cache {
  const known = caches.get(db);
  if (known) return known;
  const fresh: Cache = { words: new Map(), kanji: new Map(), lists: new Map() };
  caches.set(db, fresh);
  return fresh;
}

/** Forgets what was read from this database's packs: called once they are written or deleted. */
export function forgetDictionary(db: KanjiTutorDb): void {
  caches.delete(db);
}

/** Keeps `read` under `key`, and forgets it if it fails, so the next lookup reads again. */
function keep<T>(map: Map<string, Promise<T>>, key: string, read: Promise<T>): void {
  map.set(key, read);
  read.catch(() => {
    if (map.get(key) === read) map.delete(key);
  });
}

/** The entries for `keys`, reading the ones not asked for before in one read. */
function many<T>(
  map: Map<string, Promise<T | undefined>>,
  limit: number,
  keys: readonly string[],
  load: (missing: string[]) => Promise<(T | undefined)[]>,
): Promise<(T | undefined)[]> {
  let missing = [...new Set(keys.filter((key) => !map.has(key)))];
  if (map.size + missing.length > limit) {
    map.clear();
    missing = [...new Set(keys)];
  }
  if (missing.length > 0) {
    const rows = load(missing);
    missing.forEach((key, i) => {
      keep(
        map,
        key,
        rows.then((found) => found[i]),
      );
    });
  }
  return Promise.all(keys.map((key) => map.get(key)));
}

/** A list lookup read once; each caller gets its own copy of the list, free to sort. */
function list<T>(db: KanjiTutorDb, key: string, load: () => Promise<T[]>): Promise<T[]> {
  const { lists } = cacheOf(db);
  let hit = lists.get(key) as Promise<T[]> | undefined;
  if (!hit) {
    if (lists.size >= LIMIT.lists) lists.clear();
    hit = load();
    keep(lists, key, hit);
  }
  return hit.then((rows) => [...rows]);
}

/** The lookups of `base`, cached until the packs of `db` are next written. */
export function cachedDictionary(db: KanjiTutorDb, base: DictionaryRepo): DictionaryRepo {
  const { wordsByJlpt, kanjiByJlpt } = base;
  const words = (ids: readonly string[]) =>
    many(cacheOf(db).words, LIMIT.words, ids, (m) => base.words(m));
  const kanjiMany = (chars: readonly string[]) =>
    many(cacheOf(db).kanji, LIMIT.kanji, chars, (m) => base.kanjiMany(m));
  return {
    ...base,
    word: async (id) => (await words([id]))[0],
    words,
    wordsByText: (text) => list(db, `text:${text}`, () => base.wordsByText(text)),
    kanji: async (char) => (await kanjiMany([char]))[0],
    kanjiMany,
    kanjiByPhonetic: (c) => list(db, `phonetic:${c}`, () => base.kanjiByPhonetic(c)),
    kanjiByComponent: (c) => list(db, `component:${c}`, () => base.kanjiByComponent(c)),
    ...(wordsByJlpt && {
      wordsByJlpt: (level) => list(db, `jlpt-words:${level}`, () => wordsByJlpt(level)),
    }),
    ...(kanjiByJlpt && {
      kanjiByJlpt: (level) => list(db, `jlpt-kanji:${level}`, () => kanjiByJlpt(level)),
    }),
  };
}
