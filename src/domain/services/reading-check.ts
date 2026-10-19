/**
 * Cross-checks pre-tokenized readings against JMdict before they are graded or shown (D13 known
 * limit): kuromoji sometimes picks a valid but wrong reading of a lone kanji (間 → ま).
 */
import { hasKanji, toKanaFold } from '../kana.ts';
import type { Sentence, Token, Word } from '../types.ts';

const KANA_TAIL = /[ぁ-ゖァ-ヺー]+$/u;

/** Trailing kana (okurigana) of a written form: 待っ → っ, 食べる → べる, 駅 → ''. */
function kanaTail(text: string): string {
  return KANA_TAIL.exec(text)?.[0] ?? '';
}

/** The written form without its okurigana: 待っ → 待. */
function kanjiStem(text: string): string {
  return text.slice(0, text.length - kanaTail(text).length);
}

/** Reading of the kanji stem: 待っ/まっ → ま, 待つ/まつ → ま, 駅/えき → えき. */
export function stemReading(surface: string, reading: string): string {
  const tail = toKanaFold(kanaTail(surface));
  const kana = toKanaFold(reading);
  return tail !== '' && kana.endsWith(tail) ? kana.slice(0, -tail.length) : kana;
}

/** Stem readings of 来る (き, こ, く), which no okurigana rule can derive. */
const KURU_STEMS = ['き', 'こ', 'く'];

function fitsConjugated(token: Token, word: Word, readings: readonly string[]): boolean {
  const stem = stemReading(token.surface, token.reading);
  if (stem === '') return false;
  if (word.pos?.includes('vk') && KURU_STEMS.includes(stem)) return true;
  const surfaceStem = kanjiStem(token.surface);
  return word.forms.some(
    (form) =>
      kanjiStem(form) === surfaceStem && readings.some((r) => stemReading(form, r) === stem),
  );
}

/**
 * True when a token's reading is one of its word's JMdict readings: the whole reading for a
 * dictionary form, or the reading of the kanji stem for a conjugated one (待っ/まっ fits 待つ/まつ).
 */
export function readingFits(token: Token, word: Word): boolean {
  const readings = word.readings.map(toKanaFold);
  if (readings.includes(toKanaFold(token.reading))) return true;
  return fitsConjugated(token, word, readings);
}

/**
 * True for a token written with a single kanji in its dictionary form (間, 米, 本), whose
 * reading the tokenizer may pick wrongly. Verb and adjective stems (来, 暑) are not lone kanji.
 */
export function isLoneKanji(token: Token): boolean {
  return [...token.surface].length === 1 && hasKanji(token.surface) && token.surface === token.base;
}

const easiest = (word: Word) => word.jlpt ?? 0;

/**
 * The reading a lone kanji most likely has when context is not modelled: the primary reading of
 * the entry written that way that is on the easiest JLPT list, then common, then lowest id
 * (間 → あいだ, not ま).
 */
export function preferredReading(surface: string, entries: readonly Word[]): string | undefined {
  const written = entries.filter((entry) => entry.forms.includes(surface));
  written.sort(
    (a, b) =>
      easiest(b) - easiest(a) || Number(b.common) - Number(a.common) || Number(a.id) - Number(b.id),
  );
  const reading = written[0]?.readings[0];
  return reading === undefined ? undefined : toKanaFold(reading);
}

/** Parts of speech that conjugate, so the endings after them belong to the answer. */
const CONJUGATING = new Set(['verb', 'adjective']);

/** Endings that attach to a verb or adjective token: auxiliaries and the て/ば particles. */
const ATTACHING_PARTICLES = new Set(['て', 'で', 'ば', 'たり', 'だり', 'ちゃ', 'じゃ']);

const MAX_ATTACHED = 3;

function attaches(token: Token | undefined): token is Token {
  if (!token || hasKanji(token.surface)) return false;
  return (
    token.pos === 'auxiliary' ||
    (token.pos === 'particle' && ATTACHING_PARTICLES.has(token.surface))
  );
}

/**
 * Token indices drawn and answered together with a target: the target token plus the endings
 * that attach to a verb or adjective (待っ + て, 読み + まし + た). A noun's particles never
 * attach. The first index is always the target token.
 */
export function answerSpan(sentence: Sentence, tokenIndex: number): number[] {
  const span = [tokenIndex];
  if (!CONJUGATING.has(sentence.tokens[tokenIndex]?.pos ?? '')) return span;
  for (let i = tokenIndex + 1; span.length <= MAX_ATTACHED; i++) {
    if (!attaches(sentence.tokens[i])) break;
    span.push(i);
  }
  return span;
}

/**
 * The valid variant readings of a target (D56, `Token.variants`), each with the target's
 * attached endings, as accepted answers that are not the preferred one.
 */
export function spanVariants(sentence: Sentence, tokenIndex: number): string[] {
  const endings = answerSpan(sentence, tokenIndex)
    .slice(1)
    .map((i) => toKanaFold(sentence.tokens[i]?.reading ?? ''));
  const variants = sentence.tokens[tokenIndex]?.variants ?? [];
  return variants.flatMap((variant) =>
    [toKanaFold(variant)].concat(
      endings.map((_, i) => toKanaFold(variant) + endings.slice(0, i + 1).join('')),
    ),
  );
}

/**
 * Accepted answers for a target: its own reading first (the one shown as furigana), then the
 * reading with each attached ending (まっ, まって), so the learner may type either.
 */
export function spanReadings(sentence: Sentence, tokenIndex: number): string[] {
  const readings: string[] = [];
  let kana = '';
  for (const index of answerSpan(sentence, tokenIndex)) {
    kana += toKanaFold(sentence.tokens[index]?.reading ?? '');
    readings.push(kana);
  }
  return readings;
}
