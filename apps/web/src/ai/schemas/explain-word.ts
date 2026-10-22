import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { WordExplanation } from '../types.ts';
import { checkReading } from '../verify.ts';
import { followUpChips, readingClaim, readingClaims } from './shared.ts';

/** Raw `explainWord` reply (A2). */
export const explainWordSchema = z.object({
  surface: z.string(),
  reading: readingClaim.describe('The usual reading of the word.'),
  meaning: z.string().describe('What the word means, in a few words.'),
  nuance: z.string().describe('One or two sentences on nuance against similar forms.'),
  contrast: z
    .object({ text: z.string(), meaning: z.string() })
    .exactOptional()
    .describe('A contrasting Japanese sentence and its meaning.'),
  hook: z.string().exactOptional(),
  chips: followUpChips,
  readings: readingClaims,
});

/** Verifies the word's reading, every other claimed reading and those written in the prose. */
export async function finalizeWord(
  raw: z.output<typeof explainWordSchema>,
  _input: unknown,
  lang: Verifier,
): Promise<WordExplanation> {
  const reading = await checkReading(lang, raw.reading);
  const readings = await checkWithProse(lang, raw.readings, raw, [reading]);
  return { ...raw, reading, readings };
}
