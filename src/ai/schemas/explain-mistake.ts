import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { MistakeExplanation } from '../types.ts';
import { followUpChips, readingClaims } from './shared.ts';

/** Raw `explainMistake` reply (A1, A5). */
export const explainMistakeSchema = z.object({
  explanation: z.string().describe('Two or three plain sentences about this error only.'),
  confusedWith: z
    .object({ kanji: z.string(), meaning: z.string() })
    .exactOptional()
    .describe('The kanji the learner read instead, when the error was a lookalike.'),
  hook: z.string().exactOptional().describe('A memory hook from a word the learner knows.'),
  chips: followUpChips,
  readings: readingClaims,
});

/** Verifies the claimed readings and those written in the prose. */
export async function finalizeMistake(
  raw: z.output<typeof explainMistakeSchema>,
  _input: unknown,
  lang: Verifier,
): Promise<MistakeExplanation> {
  return { ...raw, readings: await checkWithProse(lang, raw.readings, raw) };
}
