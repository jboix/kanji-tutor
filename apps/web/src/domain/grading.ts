import { devoice, shortenVowels, toKanaFold } from './kana.ts';
import type { ErrorType, Grade } from './types.ts';

type NearMissType = Extract<ErrorType, 'long-vowel' | 'sokuon' | 'rendaku'>;

/**
 * Removes voicing marks after the first mora only. Rendaku voices a non-initial mora, so a
 * voicing change on the first mora (でんき for てんき) is a different word, not a near-miss.
 */
const devoiceAfterFirst = (kana: string) => kana.charAt(0) + devoice(kana.slice(1));

/**
 * Near-miss checks, in order. Each folds away exactly one kind of slip; if the two readings
 * become equal, the answer missed only that. Only single-kind slips count as near-misses.
 */
const NEAR_MISSES: readonly [NearMissType, (kana: string) => string][] = [
  ['sokuon', (kana) => kana.replaceAll('っ', '')],
  ['long-vowel', shortenVowels],
  ['rendaku', devoiceAfterFirst],
];

/** Which single slip separates `given` from `expected`, if any. Both are folded hiragana. */
export function nearMissType(expected: string, given: string): NearMissType | undefined {
  if (expected === given) return undefined;
  return NEAR_MISSES.find(([, fold]) => fold(expected) === fold(given))?.[0];
}

const HAS_LATIN = /[a-z]/iu;

/** True when the answer was typed in a different kana script than the accepted reading. */
function isKanaVariant(accepted: string, given: string): boolean {
  const raw = given.trim().replace(/\s+/gu, '');
  return raw !== accepted.trim() && !HAS_LATIN.test(raw);
}

function correctGrade(accepted: string, expected: string, given: string, raw: string): Grade {
  const grade: Grade = { verdict: 'correct', expected, given };
  if (isKanaVariant(accepted, raw)) grade.errorType = 'kana-variant';
  return grade;
}

/** A right answer, marked `variantOf` the preferred reading when it was a variant. */
function rightGrade(
  match: { accepted: string; answer: string; raw: string },
  expected: readonly string[],
  variants: readonly string[],
) {
  const { accepted, answer, raw } = match;
  const grade = correctGrade(accepted, answer, answer, raw);
  if (variants.map(toKanaFold).includes(answer)) grade.variantOf = expected[0] ?? answer;
  return grade;
}

function nearMissGrade(expected: readonly string[], given: string): Grade | undefined {
  for (const candidate of expected) {
    const errorType = nearMissType(candidate, given);
    if (errorType) return { verdict: 'near-miss', errorType, expected: candidate, given };
  }
  return undefined;
}

/**
 * Grades a typed or transcribed reading against the accepted readings (R5). Katakana and
 * hiragana are equivalent (`kana-variant`, still correct). A missing or extra long vowel, っ, or
 * a non-initial voicing change (rendaku) is a `near-miss` with that error type; anything else is `wrong`.
 * `confusable` lists readings of lookalike words so a match there is `wrong-kanji`. `variants`
 * lists the accepted readings that are valid but not preferred: a match is still correct,
 * with `variantOf` set to the preferred (first) reading.
 *
 * Romaji is converted to kana first and is not a kana variant. Order of checks: exact match,
 * confusable match, near-miss, then `wrong`/`other`.
 */
export function gradeReading(
  accepted: readonly string[],
  given: string,
  confusable: readonly string[] = [],
  variants: readonly string[] = [],
): Grade {
  const answer = toKanaFold(given);
  const expected = accepted.map(toKanaFold);
  const first = expected[0] ?? '';
  const exact = expected.indexOf(answer);
  if (answer !== '' && exact >= 0) {
    return rightGrade({ accepted: accepted[exact] ?? '', answer, raw: given }, expected, variants);
  }
  if (answer !== '' && confusable.map(toKanaFold).includes(answer)) {
    return { verdict: 'wrong', errorType: 'wrong-kanji', expected: first, given: answer };
  }
  const nearMiss = answer === '' ? undefined : nearMissGrade(expected, answer);
  return nearMiss ?? { verdict: 'wrong', errorType: 'other', expected: first, given: answer };
}

/**
 * The grade for "I don't know" (L4): the first accepted reading as the answer shown, graded
 * `wrong` so FSRS rates it Again, with no error type (a skip is not a slip) and `skipped` set.
 */
export function skipGrade(accepted: readonly string[]): Grade {
  return { verdict: 'wrong', expected: toKanaFold(accepted[0] ?? ''), given: '', skipped: true };
}
