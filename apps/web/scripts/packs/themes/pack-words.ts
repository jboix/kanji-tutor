/**
 * Reads the committed word pack (public/packs/<version>/words-*.json.gz) and rebuilds the token
 * lookup from it, so the theme check runs offline without the raw JMdict download.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { PackFile, PackManifest } from '../../../src/domain/repos.ts';
import type { Sentence, Token, Word } from '../../../src/domain/types.ts';
import { buildLookup, type JmWord, type Lookup } from '../jmdict.ts';
import { baseReading } from '../tokens.ts';

/** Every row of one store of the pack that `manifestPath` describes. */
export function loadStore<T>(manifestPath: string, store: PackFile['store']): T[] {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as PackManifest;
  const base = dirname(manifestPath);
  return manifest.files
    .filter((file) => file.store === store)
    .flatMap((file) => JSON.parse(gunzipSync(readFileSync(join(base, file.url))).toString()));
}

/** All words of the pack that `manifestPath` (a PackManifest JSON file) describes. */
export function loadPackWords(manifestPath: string): Word[] {
  return loadStore<Word>(manifestPath, 'words');
}

/** All sentences of that pack, tokenized and resolved by the full pipeline. */
export function loadPackSentences(manifestPath: string): Sentence[] {
  return loadStore<Sentence>(manifestPath, 'sentences');
}

/** Key of a token for the resolution table: base form, base-form reading and coarse pos. */
export function tokenKey(token: Pick<Token, 'surface' | 'reading' | 'base' | 'pos'>): string {
  const reading = baseReading(token.surface, token.base, token.reading) ?? '';
  return `${token.base}|${reading}|${token.pos}`;
}

/**
 * How the full pipeline (with all of JMdict and its usually-kana flags) resolved each kind of
 * token in the pack sentences: token key → most frequent word id. The theme check prefers it to
 * its own pack-only lookup, which cannot tell 居る from 射る.
 */
export function resolutionTable(sentences: readonly Sentence[]): Map<string, string> {
  const counts = new Map<string, Map<string, number>>();
  for (const token of sentences.flatMap((s) => s.tokens)) {
    if (!token.wordId) continue;
    const key = tokenKey(token);
    const ids = counts.get(key) ?? new Map<string, number>();
    ids.set(token.wordId, (ids.get(token.wordId) ?? 0) + 1);
    counts.set(key, ids);
  }
  const table = new Map<string, string>();
  for (const [key, ids] of counts) {
    const [best] = [...ids].sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]));
    if (best) table.set(key, best[0]);
  }
  return table;
}

/**
 * A pruned `Word` seen as a JMdict entry. The pack keeps only visible writings and the first
 * sense's part of speech, so matching is close to, not identical with, the pipeline's: a kana-only
 * pack word counts as a usually-kana word.
 */
export function asJmWord(word: Word): JmWord {
  const text = (value: string) => ({ common: word.common, text: value, tags: [] });
  return {
    id: word.id,
    kanji: word.forms.map(text),
    kana: word.readings.map(text),
    sense: [{ partOfSpeech: word.pos ?? [], misc: [], gloss: [] }],
  };
}

export function packLookup(words: Word[]): Lookup {
  return buildLookup(words.map(asJmWord));
}
