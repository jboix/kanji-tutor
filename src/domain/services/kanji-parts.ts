/**
 * Each kanji of a word with its meanings and parts (KRADFILE), named from KANJIDIC or the radical
 * table: what the word sheet and the mistake note show without AI (A13).
 */
import { hasKanji } from '../kana.ts';
import { PART_MEANINGS, plainMeaning, plainMeanings } from '../radicals.ts';
import type { Repos } from '../repos.ts';
import type { Kanji } from '../types.ts';

export interface KanjiPart {
  char: string;
  meaning?: string;
}

export interface KanjiWithParts {
  char: string;
  /** Up to three KANJIDIC meanings, radical notes removed. */
  meanings: string[];
  parts: KanjiPart[];
}

function named(char: string, kanji: Kanji | undefined): KanjiPart {
  const meaning = PART_MEANINGS[char] ?? plainMeaning(kanji?.meanings[0]);
  return meaning ? { char, meaning } : { char };
}

async function partsOf(repos: Repos, kanji: readonly Kanji[]): Promise<Map<string, KanjiPart>> {
  const chars = [...new Set(kanji.flatMap((k) => k.components))];
  const found = await repos.dictionary.kanjiMany(chars);
  return new Map(chars.map((char, i) => [char, named(char, found[i])]));
}

/** The distinct kanji of `form` (々 left out), in order. */
export function kanjiIn(form: string): string[] {
  return [...new Set([...form].filter((c) => hasKanji(c) && c !== '々'))];
}

/** The kanji of `form` with meanings and named parts; kanji missing from the packs are skipped. */
export async function kanjiWithParts(repos: Repos, form: string): Promise<KanjiWithParts[]> {
  const kanji = (await repos.dictionary.kanjiMany(kanjiIn(form))).flatMap((k) => k ?? []);
  const parts = await partsOf(repos, kanji);
  return kanji.map((k) => ({
    char: k.char,
    meanings: plainMeanings(k.meanings),
    parts: k.components.map((c) => parts.get(c) ?? { char: c }),
  }));
}
