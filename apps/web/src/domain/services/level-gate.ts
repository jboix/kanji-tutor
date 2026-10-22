/**
 * Level gating (G3): a session shows only sentences at or below the learner's
 * level, and its new words come only from that level or an easier one. Class-lesson words may be
 * one level harder. The words of the current unit and of opened units are taught by the unit, so
 * they pass whatever their JLPT tag, in sentences up to one level above the learner's (or at
 * the unit's level when that is harder).
 */
import { hasKanji } from '../kana.ts';
import type { JlptLevel } from '../learner-view.ts';
import type { Repos } from '../repos.ts';
import { unknownTokens } from '../selector.ts';
import type { WordLevels } from '../session-types.ts';
import type { Kanji, LearnerLevel, Sentence, Word } from '../types.ts';

/** What a session may show (G3). */
export interface LevelGate {
  /** The learner's level: the hardest sentence level allowed. */
  level: LearnerLevel;
  /** Word ids allowed one level harder: the class lesson's. */
  stretch: ReadonlySet<string>;
  /**
   * Words a current or opened unit teaches (T3), each with the hardest level a sentence
   * teaching it may have. They pass the word check whatever their own JLPT tag.
   */
  taught?: ReadonlyMap<string, JlptLevel>;
}

/** JLPT level of a word id, as the gate counts it. */
export type WordJlpt = ReadonlyMap<string, JlptLevel>;

/** One level harder than `level` (N4 → N3), never past N1. */
export function stretchLevel(level: LearnerLevel): JlptLevel {
  return Math.max(1, level - 1) as JlptLevel;
}

/** The hardest sentence level allowed for a sentence that teaches this word. */
export function maxLevelFor(gate: LevelGate, wordId: string): JlptLevel {
  const taught = gate.taught?.get(wordId);
  if (taught !== undefined) return taught;
  return gate.stretch.has(wordId) ? stretchLevel(gate.level) : gate.level;
}

/**
 * Sentence levels for the words units teach: one level above the learner's, or the
 * unit's level when that is harder. A word in several units takes the most generous.
 */
export function taughtLevels(
  units: readonly { level: JlptLevel; wordIds: readonly string[] }[],
  level: LearnerLevel,
): Map<string, JlptLevel> {
  const out = new Map<string, JlptLevel>();
  for (const unit of units) {
    const allowed = Math.min(stretchLevel(level), unit.level) as JlptLevel;
    for (const id of unit.wordIds) out.set(id, Math.min(allowed, out.get(id) ?? 5) as JlptLevel);
  }
  return out;
}

function unknownIds(sentence: Sentence, levels: WordLevels): (string | undefined)[] {
  return unknownTokens(sentence, levels).map((i) => sentence.tokens[i]?.wordId);
}

/**
 * Bound pieces the lists tag erratically (的 as N1, さん as N1): their level is not checked,
 * as the pack's sentence level leaves them out too. They must still resolve.
 */
const BOUND_POS: ReadonlySet<string> = new Set(['suffix', 'prefix']);

/** Unknown words whose level the gate checks: all but bound pieces (undefined: unresolved). */
function checkedIds(sentence: Sentence, levels: WordLevels): (string | undefined)[] {
  return unknownTokens(sentence, levels).flatMap((i) => {
    const token = sentence.tokens[i];
    return token && BOUND_POS.has(token.pos) && token.wordId ? [] : [token?.wordId];
  });
}

/** The hardest level this sentence may have: the most any of its unknown words allows. */
function allowedFor(gate: LevelGate, sentence: Sentence, levels: WordLevels): JlptLevel {
  const ids = unknownIds(sentence, levels).flatMap((id) => id ?? []);
  return Math.min(gate.level, ...ids.map((id) => maxLevelFor(gate, id))) as JlptLevel;
}

/**
 * Each unknown word is taught by a unit, or at or below its allowed level; a word missing from
 * `wordJlpt` is N1.
 */
function newWordsFit(gate: LevelGate, sentence: Sentence, levels: WordLevels, wordJlpt: WordJlpt) {
  const fits = (id: string) =>
    gate.taught?.has(id) === true || (wordJlpt.get(id) ?? 1) >= maxLevelFor(gate, id);
  return checkedIds(sentence, levels).every((id) => id !== undefined && fits(id));
}

/**
 * True when the sentence passes the gate: its level (when it has one: packs, units) is at or
 * below the allowed one, and so is each word it would teach. Sentences without a level (a
 * capture, an AI or own sentence) are judged by those words alone. The word check matters for
 * levelled sentences too: the pack's level leaves pronouns and affixes out, so お前 (N3)
 * can sit in an N4 sentence.
 */
export function fitsGate(
  gate: LevelGate,
  sentence: Sentence,
  levels: WordLevels,
  wordJlpt: WordJlpt,
): boolean {
  const levelled =
    sentence.level === undefined || sentence.level >= allowedFor(gate, sentence, levels);
  return levelled && newWordsFit(gate, sentence, levels, wordJlpt);
}

function hardestKanji(word: Word, kanji: ReadonlyMap<string, Pick<Kanji, 'jlpt'>>): JlptLevel {
  const chars = [...(word.forms[0] ?? '')].filter(hasKanji);
  const levels = chars.map((c) => kanji.get(c)?.jlpt ?? 1);
  return Math.min(5, ...levels) as JlptLevel;
}

/**
 * Word levels as the packs count them, from loaded entries: the JLPT tag, else for a
 * common word the level of its hardest kanji, else N1. Pure.
 */
export function wordJlptFrom(
  words: readonly Word[],
  kanji: ReadonlyMap<string, Pick<Kanji, 'jlpt'>>,
): Map<string, JlptLevel> {
  return new Map(
    words.map((w) => [w.id, w.jlpt ?? (w.common ? hardestKanji(w, kanji) : 1)] as const),
  );
}

/** {@link wordJlptFrom} over the `Repos` port. */
export async function wordJlptOf(repos: Repos, ids: readonly string[]): Promise<WordJlpt> {
  const unique = [...new Set(ids)];
  const words = (await repos.dictionary.words(unique)).flatMap((w) => (w ? [w] : []));
  const chars = [...new Set(words.flatMap((w) => [...(w.forms[0] ?? '')].filter(hasKanji)))];
  const kanji = new Map(
    (await repos.dictionary.kanjiMany(chars)).flatMap((k) => (k ? [[k.char, k] as const] : [])),
  );
  return wordJlptFrom(words, kanji);
}

/** Most unknown words a sentence can have and still carry a card (R2). */
const MAX_NEW = 2;

/**
 * The sentences that pass the gate. Sentences with more unknown words than a card can target
 * are dropped without lookups.
 */
export async function gateSentences(
  repos: Repos,
  gate: LevelGate,
  sentences: readonly Sentence[],
  levels: WordLevels,
): Promise<Sentence[]> {
  const usable = sentences.filter((s) => unknownTokens(s, levels).length <= MAX_NEW);
  const ids = usable.flatMap((s) => unknownIds(s, levels).flatMap((id) => id ?? []));
  const wordJlpt = ids.length > 0 ? await wordJlptOf(repos, ids) : new Map<string, JlptLevel>();
  return usable.filter((s) => fitsGate(gate, s, levels, wordJlpt));
}
