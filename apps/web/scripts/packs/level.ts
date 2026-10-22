/**
 * Sentence level (G2, D31, D56): the hardest JLPT level among the sentence's kanji words, its
 * detected grammar, and the kanji that none of its words cover (a kanji written in a suffix,
 * prefix or pronoun). A word's own level already accounts for its kanji, so 悪い (N5) makes an
 * N5 sentence whatever KANJIDIC says of 悪. A word or kanji with no JLPT tag counts as N1. Pure.
 */
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { Token } from '../../src/domain/types.ts';

const HAN = /\p{Script=Han}/u;
/** Kanji characters; the iteration mark 々 and 〆 are not kanji of their own. */
const HAN_ALL = /(?![々〆〇])\p{Script=Han}/gu;

/**
 * Bound pieces and pronouns are left out of the word rule, as in the theme check
 * (scripts/packs/themes/exceptions.ts): the lists tag them erratically (さん as N1, これ on an
 * archaic kanji entry). Their kanji still count.
 */
const LEVEL_FREE_POS = new Set(['suffix', 'prefix', 'pronoun', 'particle', 'auxiliary']);

export interface LevelContext {
  /** JLPT level of a JMdict id (after overrides). */
  wordLevel: (id: string) => JlptLevel | undefined;
  /** JLPT level of a kanji. */
  kanjiLevel: (char: string) => JlptLevel | undefined;
  /** JLPT level of a catalogue grammar id. */
  grammarLevel: (id: string) => JlptLevel | undefined;
}

/** Content tokens written with a kanji that carry a word id: the ones the word rule counts. */
function kanjiWordTokens(tokens: readonly Token[]): Token[] {
  return tokens.filter((t) => t.wordId && HAN.test(t.surface) && !LEVEL_FREE_POS.has(t.pos));
}

/** The kanji words of a sentence: content tokens written with a kanji, with their word id. */
export function kanjiWordIds(tokens: readonly Token[]): string[] {
  return [...new Set(kanjiWordTokens(tokens).flatMap((t) => t.wordId ?? []))];
}

/** Kanji of `text` that no counted word covers: written in an affix, a pronoun or an unknown. */
export function uncoveredKanji(text: string, tokens: readonly Token[]): string[] {
  const covered = new Set(kanjiWordTokens(tokens).flatMap((t) => [...t.surface]));
  return [...new Set(text.match(HAN_ALL) ?? [])].filter((c) => !covered.has(c));
}

function hardest(levels: Iterable<JlptLevel>): JlptLevel {
  let out: JlptLevel = 5;
  for (const level of levels) if (level < out) out = level;
  return out;
}

/** Level of a sentence: 5 when it has nothing above N5, 1 when any part is N1 or untagged. */
export function sentenceLevel(
  text: string,
  tokens: readonly Token[],
  grammarIds: readonly string[],
  ctx: LevelContext,
): JlptLevel {
  const words = kanjiWordIds(tokens).map((id) => ctx.wordLevel(id) ?? 1);
  const kanji = uncoveredKanji(text, tokens).map((c) => ctx.kanjiLevel(c) ?? 1);
  const grammar = grammarIds.map((id) => ctx.grammarLevel(id) ?? 5);
  return hardest([...words, ...kanji, ...grammar]);
}
