import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { GeneratedSentences } from '../types.ts';
import { keepVerifiedSentences } from '../verify.ts';
import { readingClaims } from './shared.ts';

/** Raw `generateSentences` reply (R6). */
export const generatedSentencesSchema = z.object({
  sentences: z.array(
    z.object({
      text: z.string().describe('A natural Japanese sentence.'),
      translation: z.string(),
      target: z.string().describe('The target word exactly as it appears in the sentence.'),
    }),
  ),
  readings: readingClaims.describe('The reading of every kanji word in every sentence.'),
});

/** Verifies readings and drops sentences that contain a failed reading or miss their target. */
export async function finalizeSentences(
  raw: z.output<typeof generatedSentencesSchema>,
  _input: unknown,
  lang: Verifier,
): Promise<GeneratedSentences> {
  const readings = await checkWithProse(lang, raw.readings, raw);
  return { sentences: keepVerifiedSentences(raw.sentences, readings), readings };
}
