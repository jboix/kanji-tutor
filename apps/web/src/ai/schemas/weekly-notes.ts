import { z } from 'zod';
import type { WeeklyNotes } from '../types.ts';

/** Raw `weeklyNotes` reply (A7). */
export const weeklyNotesSchema = z.object({
  letter: z.array(z.string()).describe('Two to four short paragraphs, plain and specific.'),
  plan: z
    .array(
      z.object({
        when: z.string().describe('e.g. "Daily" or "Tue, Thu".'),
        what: z.string().describe('One concrete line.'),
      }),
    )
    .describe('Two to four plan lines for next week.'),
});

/** Nothing to verify: the letter quotes stats the app computed. */
export function finalizeWeeklyNotes(raw: z.output<typeof weeklyNotesSchema>): Promise<WeeklyNotes> {
  return Promise.resolve(raw);
}
