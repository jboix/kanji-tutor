import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { SignReading } from '../types.ts';
import { readingClaims } from './shared.ts';

const box = z
  .array(z.number().int().min(0).max(1000))
  .length(4)
  .describe('[top, left, bottom, right], 0–1000 of the image.');

/** Raw `readSign` reply. */
export const readSignSchema = z.object({
  place: z.string().describe('What the photo shows, in a few words.'),
  lines: z.array(z.string()).describe('Every Japanese line, as printed, in reading order.'),
  kanji: z
    .array(z.object({ char: z.string().length(1), box }))
    .describe('Every kanji seen, each time it appears, with its box.'),
  words: z
    .array(z.object({ surface: z.string(), reading: z.string(), meaning: z.string() }))
    .describe('Every word written with kanji, its reading in hiragana and a short meaning.'),
  readings: readingClaims,
});

/** Checks every word's reading, and those the model claims besides. */
export async function finalizeSignReading(
  raw: z.output<typeof readSignSchema>,
  _input: unknown,
  lang: Verifier,
): Promise<SignReading> {
  const claims = [
    ...raw.words.map(({ surface, reading }) => ({ surface, reading })),
    ...raw.readings,
  ];
  const kanji = raw.kanji.map(({ char, box: b }) => ({
    char,
    box: [b[0] ?? 0, b[1] ?? 0, b[2] ?? 0, b[3] ?? 0] as const,
  }));
  return { ...raw, kanji, readings: await checkWithProse(lang, claims, raw) };
}
