import { z } from 'zod';
import type { HandwritingCandidates } from '../types.ts';
import { kanjiOnly } from '../verify.ts';

/** Raw `recognizeHandwriting` reply (I4). */
export const handwritingSchema = z.object({
  candidates: z
    .array(z.string().trim())
    .describe('Up to five single kanji the drawing could be, best first.'),
});

/** Keeps candidates that are a single kanji. */
export function finalizeHandwriting(
  raw: z.output<typeof handwritingSchema>,
): Promise<HandwritingCandidates> {
  return Promise.resolve({ candidates: kanjiOnly(raw.candidates, (char) => char) });
}
