import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { Answer } from '../types.ts';
import { readingClaims } from './shared.ts';

/** Raw `answerQuestion` reply (A4). */
export const answerSchema = z.object({
  answer: z.string().describe('A short, direct answer in the explanation language.'),
  readings: readingClaims,
});

/** Verifies the claimed readings and those written in the prose. */
export async function finalizeAnswer(
  raw: z.output<typeof answerSchema>,
  _input: unknown,
  lang: Verifier,
): Promise<Answer> {
  return { ...raw, readings: await checkWithProse(lang, raw.readings, raw) };
}
