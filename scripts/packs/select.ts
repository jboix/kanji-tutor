/** Sentence filtering and selection for the packs. Pure, deterministic. */
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { Sentence, Token } from '../../src/domain/types.ts';
import type { Pair } from './tatoeba.ts';

/** Longest sentence kept at N5 and N4. */
export const MAX_SENTENCE_LENGTH = 30;
/** Longest sentence kept at N3 and above: harder grammar needs a few more characters. */
export const MAX_SENTENCE_LENGTH_N3 = 40;

const HAS_KANJI = /\p{Script=Han}/u;
const LATIN_OR_DIGIT = /[A-Za-z0-9Ａ-Ｚａ-ｚ０-９]/;

/** Normalised text used to drop duplicate sentences. */
export function dedupeKey(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\s。．.!！?？、,，「」『』…]/g, '')
    .trim();
}

/** Short Japanese sentences with at least one kanji and no Latin letters or digits. */
export function keepText(text: string): boolean {
  return (
    text.length <= MAX_SENTENCE_LENGTH_N3 && HAS_KANJI.test(text) && !LATIN_OR_DIGIT.test(text)
  );
}

/** N5 and N4 sentences stay within 30 characters; N3 and harder ones may take 40. */
export function fitsLevelLength(sentence: Pick<Sentence, 'text' | 'level'>): boolean {
  const max = (sentence.level ?? 1) >= 4 ? MAX_SENTENCE_LENGTH : MAX_SENTENCE_LENGTH_N3;
  return sentence.text.length <= max;
}

/** Drops duplicates (same text after normalisation), keeping the lowest Tatoeba id. */
export function dedupe(pairs: Pair[]): Pair[] {
  const seen = new Set<string>();
  return pairs.filter((pair) => {
    const key = dedupeKey(pair.text);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const FUNCTION_POS = new Set(['particle', 'auxiliary', 'symbol']);

/** Word ids of content tokens (not particles, auxiliaries or symbols). */
export function contentWordIds(tokens: Token[]): string[] {
  return [
    ...new Set(tokens.filter((t) => t.wordId && !FUNCTION_POS.has(t.pos)).map((t) => t.wordId)),
  ] as string[];
}

export function toSentence(
  pair: Pair,
  tokens: Token[],
  tags: { grammarIds: string[]; level: JlptLevel },
): Sentence {
  const wordIds = [...new Set(tokens.flatMap((t) => (t.wordId ? [t.wordId] : [])))];
  return {
    id: `tatoeba:${pair.id}`,
    text: pair.text,
    translation: pair.translation,
    source: 'tatoeba',
    sourceRef: pair.id,
    tokens,
    wordIds,
    grammarIds: tags.grammarIds,
    level: tags.level,
    verified: true,
  };
}
