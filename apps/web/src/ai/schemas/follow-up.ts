import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { FollowUpResult } from '../types.ts';
import { readingClaims } from './shared.ts';

const quiz = z
  .object({
    question: z.string(),
    options: z.array(z.string()).describe('Two to four options.'),
    answerIndex: z.int().min(0).describe('Index of the right option.'),
  })
  .refine((value) => value.answerIndex < value.options.length, {
    message: 'answerIndex is out of range',
    path: ['answerIndex'],
  });

/** Raw `followUp` reply (A3). */
export const followUpSchema = z.object({
  text: z.string(),
  example: z.object({ text: z.string(), translation: z.string() }).exactOptional(),
  quiz: quiz.exactOptional().describe('Only for a quiz follow-up.'),
  readings: readingClaims,
});

/** Verifies the claimed readings and those written in the prose. */
export async function finalizeFollowUp(
  raw: z.output<typeof followUpSchema>,
  _input: unknown,
  lang: Verifier,
): Promise<FollowUpResult> {
  return { ...raw, readings: await checkWithProse(lang, raw.readings, raw) };
}
