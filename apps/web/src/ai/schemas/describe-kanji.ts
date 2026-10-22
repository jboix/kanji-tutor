import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { KanjiCandidates } from '../types.ts';
import { kanjiOnly } from '../verify.ts';
import { readingClaims } from './shared.ts';

/** Raw `describeKanji` reply (I5). `readings` is optional so older cached replies still parse. */
export const kanjiCandidatesSchema = z.object({
  candidates: z
    .array(
      z.object({
        char: z.string().trim().describe('One kanji character.'),
        reason: z.string().describe('Why it fits the description, in a few words.'),
      }),
    )
    .describe('Up to five candidates, best first.'),
  readings: readingClaims.exactOptional(),
});

/** Keeps candidates that are a single kanji and verifies the readings their reasons show. */
export async function finalizeKanjiCandidates(
  raw: z.output<typeof kanjiCandidatesSchema>,
  _input: unknown,
  lang: Verifier,
): Promise<KanjiCandidates> {
  const candidates = kanjiOnly(raw.candidates, (candidate) => candidate.char);
  return { candidates, readings: await checkWithProse(lang, raw.readings ?? [], { candidates }) };
}
