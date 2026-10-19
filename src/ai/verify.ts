/** Verification pass (A8): every reading the model claims is checked before it is shown. */

import type { Verifier } from './task-def.ts';
import type { CheckedReading, ReadingClaim } from './types.ts';

/** Checks one claim. Only `verified` counts; `mismatch`, `unknown` and errors stay unverified. */
export async function checkReading(lang: Verifier, claim: ReadingClaim): Promise<CheckedReading> {
  const surface = claim.surface.trim();
  const reading = claim.reading.trim();
  try {
    const check = await lang.verifyReading(surface, reading);
    const verified = check.status === 'verified';
    const preferred = check.status === 'verified' ? check.preferred : undefined;
    return preferred ? { surface, reading, verified, preferred } : { surface, reading, verified };
  } catch {
    return { surface, reading, verified: false };
  }
}

/** Checks every claim, dropping exact duplicates. Readings are never replaced by expected ones. */
export function checkReadings(lang: Verifier, claims: ReadingClaim[]): Promise<CheckedReading[]> {
  const seen = new Set<string>();
  const unique = claims.filter((claim) => {
    const key = `${claim.surface.trim()}\u0000${claim.reading.trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return Promise.all(unique.map((claim) => checkReading(lang, claim)));
}

/**
 * Keeps generated sentences that contain their target and none of the failed readings. The caller
 * still runs the i+1 check.
 */
export function keepVerifiedSentences<S extends { text: string; target: string }>(
  sentences: S[],
  readings: CheckedReading[],
): S[] {
  const failed = readings.filter((reading) => !reading.verified).map((reading) => reading.surface);
  return sentences.filter(
    (sentence) =>
      sentence.text.includes(sentence.target) &&
      !failed.some((surface) => surface !== '' && sentence.text.includes(surface)),
  );
}

const SINGLE_KANJI = /^\p{Script=Han}$/u;
/** Han-script marks that are not kanji a learner could look up. */
const MARKS = new Set(['々', '〆', '〇', '〻']);

/** True for exactly one CJK ideograph, e.g. "待" (not "待つ", "ま" or "々"). */
export function isSingleKanji(text: string): boolean {
  return SINGLE_KANJI.test(text) && !MARKS.has(text);
}

/** Trimmed, single-kanji, de-duplicated candidates, in the model's order. */
export function kanjiOnly<C>(candidates: C[], charOf: (candidate: C) => string): C[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const char = charOf(candidate).trim();
    if (!isSingleKanji(char) || seen.has(char)) return false;
    seen.add(char);
    return true;
  });
}
