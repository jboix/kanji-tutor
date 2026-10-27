import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { KanjiStory } from '../types.ts';
import { readingClaims } from './shared.ts';

/** Raw `kanjiStory` reply. */
export const kanjiStorySchema = z.object({
  line: z.string().describe('One or two sentences: a picture from the parts to the meaning.'),
  story: z.object({
    text: z.string().describe('One or two short Japanese sentences with the kanji.'),
    translation: z.string(),
  }),
  readings: readingClaims.describe('The reading of every kanji word in the line and the story.'),
});

/** Verifies the claimed readings and those written in the line and the story. */
export async function finalizeKanjiStory(
  raw: z.output<typeof kanjiStorySchema>,
  _input: unknown,
  lang: Verifier,
): Promise<KanjiStory> {
  return { ...raw, readings: await checkWithProse(lang, raw.readings, raw) };
}
