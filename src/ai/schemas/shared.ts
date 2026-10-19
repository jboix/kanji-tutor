import { z } from 'zod';

/** A reading the model claims; verified before display (A8). */
export const readingClaim = z.object({
  surface: z.string().describe('The Japanese word or kanji as written, e.g. 紹介.'),
  reading: z.string().describe('Its reading in hiragana, e.g. しょうかい.'),
});

/** Every reading the text mentions or implies, including any furigana. */
export const readingClaims = z
  .array(readingClaim)
  .describe('Every Japanese reading the text mentions or implies, with the reading in hiragana.');

/** A follow-up chip (A3). */
export const followUpChip = z.object({
  kind: z.enum(['compare', 'example', 'simpler', 'quiz', 'keep']),
  label: z
    .string()
    .describe('Short button text in the explanation language, e.g. "待 and 持 side by side".'),
});

export const followUpChips = z.array(followUpChip).describe('Two to four follow-up chips.');
