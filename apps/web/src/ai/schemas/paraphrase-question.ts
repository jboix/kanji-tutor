import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { ParaphraseInput, ParaphraseQuestion } from '../types.ts';
import { readingClaims } from './shared.ts';

/** Raw `paraphraseQuestion` reply (J6). */
export const paraphraseSchema = z.object({
  options: z
    .array(
      z.object({
        text: z.string().describe('A short Japanese option.'),
        why: z.string().describe('Why it is closest in meaning, or why it is not.'),
      }),
    )
    .describe('Exactly four options.'),
  answerIndex: z.number().int().describe('Index of the option closest in meaning, 0 to 3.'),
  readings: readingClaims.describe('The reading of every kanji word in every option.'),
});

type Raw = z.output<typeof paraphraseSchema>;

const HAN = /\p{Script=Han}/u;

/** Four distinct options and an answer among them. */
function wellFormed(raw: Raw): boolean {
  const texts = raw.options.map((option) => option.text.trim());
  const distinct = new Set(texts).size === 4 && texts.every((text) => text !== '');
  return texts.length === 4 && distinct && raw.answerIndex >= 0 && raw.answerIndex < 4;
}

/**
 * Verifies the readings (A8). The question counts as verified only when it is well formed, every
 * reading is confirmed, and every option with kanji has at least one confirmed reading in it.
 */
export async function finalizeParaphrase(
  raw: Raw,
  input: ParaphraseInput,
  lang: Verifier,
): Promise<ParaphraseQuestion> {
  const readings = await checkWithProse(lang, raw.readings, raw);
  const confirmed = readings.filter((reading) => reading.verified);
  const covered = raw.options.every(
    (option) =>
      !HAN.test(option.text) || confirmed.some((reading) => option.text.includes(reading.surface)),
  );
  const verified = wellFormed(raw) && covered && confirmed.length === readings.length;
  const phrase = input.phrase ?? input.sentence.text;
  return { phrase, options: raw.options, answerIndex: raw.answerIndex, readings, verified };
}
