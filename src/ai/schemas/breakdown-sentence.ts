import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { BreakdownInput, SentenceBreakdown } from '../types.ts';
import { readingClaims } from './shared.ts';

/** Raw `breakdownSentence` reply (A2). */
export const breakdownSchema = z.object({
  translation: z.string(),
  chunks: z
    .array(
      z.object({
        text: z.string().describe('A chunk of the sentence, copied exactly.'),
        gloss: z.string().describe('A short gloss in the explanation language.'),
      }),
    )
    .describe('The sentence split into meaningful chunks, in order, covering all of it.'),
  readings: readingClaims,
});

/**
 * Verifies the claimed readings and those written in the prose, and marks the first chunk that
 * holds the tapped word. The marking runs on cached answers too: the cache is per sentence (A15).
 */
export async function finalizeBreakdown(
  raw: z.output<typeof breakdownSchema>,
  input: Pick<BreakdownInput, 'focus'>,
  lang: Verifier,
): Promise<SentenceBreakdown> {
  const focus = input.focus;
  const at = focus ? raw.chunks.findIndex((chunk) => chunk.text.includes(focus)) : -1;
  const chunks = raw.chunks.map((chunk, i) => ({
    text: chunk.text,
    gloss: chunk.gloss,
    focus: i === at,
  }));
  return {
    translation: raw.translation,
    chunks,
    readings: await checkWithProse(lang, raw.readings, raw),
  };
}
