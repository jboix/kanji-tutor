/**
 * The spellings of a kana span (C6), from the words the local dictionary has for it: kana
 * function words stay kana and cost least, then the learner's own words, common words and easier
 * JLPT levels; an inflected verb or adjective keeps its ending in kana (食べ + ます). Pure: the
 * words are looked up beforehand.
 */

import { hasKanji, toKanaFold } from '../kana.ts';
import { classOfPos } from '../questions/conjugate.ts';
import type { Word } from '../types.ts';
import type { Speller, Spelling } from './kana-lattice.ts';
import { type Inflection, inflections, KANA_FUNCTION_WORDS, type StemKind } from './kana-words.ts';

/** Words read exactly as each looked-up kana, and the learner's level for each word id. */
export interface Lookup {
  words: ReadonlyMap<string, readonly Word[]>;
  levels: ReadonlyMap<string, number>;
}

/** A function word: cheaper than any word, so は stays は. */
const FUNCTION_COST = 0.2;
/** An inflected form, a little dearer than the same word uninflected. */
const INFLECTED_COST = 0.3;
/** A stem on its own (食べ while typing): only when nothing better spells it. */
const BARE_STEM_COST = 2;

/** Known words first (the better known the cheaper), then common ones, then easier levels. */
function wordCost(word: Word, levels: ReadonlyMap<string, number>): number {
  const level = levels.get(word.id) ?? 0;
  const base = level > 0 ? 0.6 - Math.min(level, 5) * 0.02 : word.common ? 1 : 2;
  return base + (5 - (word.jlpt ?? 0)) * 0.05;
}

function spelling(word: Word, form: string, cost: number, lookup: Lookup): Spelling {
  const known = (lookup.levels.get(word.id) ?? 0) > 0;
  return { form, cost: cost + wordCost(word, lookup.levels), known, wordId: word.id };
}

/** Dictionary words read as `kana`, in their kanji form (or in kana when they have none). */
function wordSpellings(kana: string, lookup: Lookup): Spelling[] {
  return (lookup.words.get(kana) ?? []).map((word) =>
    spelling(word, word.forms.find(hasKanji) ?? kana, 0, lookup),
  );
}

const KIND_CHECK: Record<StemKind, (pos: readonly string[]) => boolean> = {
  v1: (pos) => classOfPos(pos) === 'v1',
  v5: (pos) => pos.some((tag) => /^v5/u.test(tag)),
  adj: (pos) => pos.includes('adj-i'),
};

/** The inflected spelling of `word` (read `dict`): its kanji stem, okurigana, then the ending. */
function inflectedForm(word: Word, { dict, stem, ending, kind }: Inflection): string | undefined {
  if (!KIND_CHECK[kind](word.pos ?? [])) return undefined;
  const form = word.forms.find((f) => hasKanji(f) && f.endsWith(dict.slice(-1)));
  return form && form.slice(0, -1) + stem.slice(dict.length - 1) + ending;
}

function inflectedSpellings(kana: string, lookup: Lookup): Spelling[] {
  return inflections(kana).flatMap((inflection) =>
    (lookup.words.get(inflection.dict) ?? []).flatMap((word) => {
      const form = inflectedForm(word, inflection);
      const cost = inflection.ending === '' ? BARE_STEM_COST : INFLECTED_COST;
      return form ? [spelling(word, form, cost, lookup)] : [];
    }),
  );
}

/** One spelling per form, cheapest first. */
function cheapestFirst(list: readonly Spelling[]): Spelling[] {
  const sorted = [...list].sort((a, b) => a.cost - b.cost || a.form.length - b.form.length);
  const seen = new Set<string>();
  return sorted.filter((s) => !seen.has(s.form) && seen.add(s.form));
}

/** The speller over looked-up words: every spelling of a span, cheapest first. */
export function spellerOf(lookup: Lookup): Speller {
  const memo = new Map<string, Spelling[]>();
  return (kana) => {
    const kept = memo.get(kana);
    if (kept) return kept;
    const own: Spelling[] = KANA_FUNCTION_WORDS.has(kana)
      ? [{ form: kana, cost: FUNCTION_COST, known: false }]
      : [];
    const list = cheapestFirst([
      ...own,
      ...wordSpellings(kana, lookup),
      ...inflectedSpellings(kana, lookup),
    ]);
    memo.set(kana, list);
    return list;
  };
}

/** Whether `word` is read exactly as `kana`. */
export function readsAs(word: Word, kana: string): boolean {
  const folded = toKanaFold(kana);
  return word.readings.some((reading) => toKanaFold(reading) === folded);
}

/** The kana to look up for a run: every span of a word's length, and what inflections come from. */
export function lookupKeys(kana: string, maxWord: number): string[] {
  const keys = new Set<string>();
  for (let from = 0; from < kana.length; from++) {
    for (let to = from + 1; to <= Math.min(kana.length, from + maxWord); to++) {
      const span = kana.slice(from, to);
      keys.add(span);
      for (const inflection of inflections(span)) keys.add(inflection.dict);
    }
  }
  return [...keys];
}
