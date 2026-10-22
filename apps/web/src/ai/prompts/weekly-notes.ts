import type { Prompt } from '../task-def.ts';
import type { WeeklyNotesInput } from '../types.ts';
import { joinLines, profileLines, TUTOR } from './shared.ts';

/** A7: the weekly letter and next week's plan, from real stats. */
export const weeklyNotesPrompt: Prompt<WeeklyNotesInput> = {
  version: 2,
  system: joinLines(
    TUTOR,
    'Write a short weekly letter to the learner from the stats given: two to four paragraphs,',
    'concrete and honest, quoting real counts and real missed words. Name the main pattern in',
    'the misses and why it happens. Mention grammar points they have not used yet. No praise.',
    'Then a plan for next week in two to four lines, each with when (e.g. "Daily", "Tue, Thu")',
    'and what, adjusted to the misses.',
  ),
  build: (input, profile) =>
    joinLines(
      `Week: ${input.stats.week}`,
      `Stats: ${JSON.stringify(input.stats)}`,
      profileLines(profile),
    ),
};
