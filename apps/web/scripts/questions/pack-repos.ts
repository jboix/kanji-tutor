/**
 * The full committed packs (public/packs/<version>/) loaded into memory repos with indexed
 * lookups, for the question quality harness. Reads the pack files the way the pack tests do.
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { DictionaryRepo, PackFile, PackManifest, Repos } from '../../src/domain/repos.ts';
import type { Kanji, Sentence, Word } from '../../src/domain/types.ts';
import { createMemoryRepos } from '../../src/test/memory-repos.ts';

export const MANIFEST = resolve(import.meta.dirname, '../../public/packs/manifest.json');

function loadStore<T>(store: PackFile['store']): T[] {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as PackManifest;
  const base = dirname(MANIFEST);
  return manifest.files
    .filter((file) => file.store === store)
    .flatMap((file) => JSON.parse(gunzipSync(readFileSync(join(base, file.url))).toString()));
}

export interface FullPack {
  words: Word[];
  kanji: Kanji[];
  sentences: Sentence[];
}

export function loadFullPack(): FullPack {
  return {
    words: loadStore<Word>('words'),
    kanji: loadStore<Kanji>('kanji'),
    sentences: loadStore<Sentence>('sentences'),
  };
}

function indexBy<T>(rows: readonly T[], keys: (row: T) => readonly string[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    for (const key of new Set(keys(row))) map.set(key, [...(map.get(key) ?? []), row]);
  }
  return map;
}

function packDictionary(pack: FullPack): DictionaryRepo {
  const byId = new Map(pack.words.map((w) => [w.id, w]));
  const byText = indexBy(pack.words, (w) => [...w.forms, ...w.readings]);
  const byJlpt = indexBy(pack.words, (w) => (w.jlpt === undefined ? [] : [String(w.jlpt)]));
  const byChar = new Map(pack.kanji.map((k) => [k.char, k]));
  const byPart = indexBy(pack.kanji, (k) => k.components);
  const byPhonetic = indexBy(pack.kanji, (k) => (k.phonetic ? [k.phonetic] : []));
  const kanjiJlpt = indexBy(pack.kanji, (k) => (k.jlpt === undefined ? [] : [String(k.jlpt)]));
  return {
    word: async (id) => byId.get(id),
    words: async (ids) => ids.map((id) => byId.get(id)),
    wordsByText: async (text) => byText.get(text) ?? [],
    wordsByReadingPrefix: async (kana, limit) =>
      pack.words.filter((w) => w.readings.some((r) => r.startsWith(kana))).slice(0, limit),
    kanji: async (char) => byChar.get(char),
    kanjiMany: async (chars) => chars.map((c) => byChar.get(c)),
    kanjiByPhonetic: async (part) => byPhonetic.get(part) ?? [],
    kanjiByComponent: async (part) => byPart.get(part) ?? [],
    wordCount: async () => pack.words.length,
    wordsByJlpt: async (level) => byJlpt.get(String(level)) ?? [],
    kanjiByJlpt: async (level) => kanjiJlpt.get(String(level)) ?? [],
  };
}

/** Memory repos over the full pack, with an indexed `containingWord`. */
export function packRepos(pack: FullPack): Repos {
  const repos = createMemoryRepos({ dictionary: packDictionary(pack) });
  const byWord = indexBy(pack.sentences, (s) => s.wordIds);
  repos.sentences = {
    ...repos.sentences,
    containingWord: async (id) => byWord.get(id) ?? [],
  };
  return repos;
}
