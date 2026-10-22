import { z } from 'zod';
import type { Extraction } from '../types.ts';

/** Raw `extractFromImage` reply (C1). */
export const extractionSchema = z.object({
  lines: z.array(z.string()).describe('Each printed Japanese line, in reading order, exactly.'),
});

const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/** Keeps trimmed lines that contain Japanese; drops English, page numbers and blanks. */
export function finalizeExtraction(raw: z.output<typeof extractionSchema>): Promise<Extraction> {
  const lines = raw.lines.map((line) => line.trim()).filter((line) => JAPANESE.test(line));
  return Promise.resolve({ lines });
}
