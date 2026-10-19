import { z } from 'zod';
import type { Transcription } from '../types.ts';

/** Kana, the long-vowel mark and spaces only: a kanji answer means the model auto-corrected. */
const KANA_ONLY = /^[ぁ-ゖゝゞァ-ヺー\s]+$/u;

/** Raw `transcribeReading` reply (I2). */
export const transcriptionSchema = z.object({
  kana: z
    .string()
    .trim()
    .regex(KANA_ONLY)
    .describe('Hiragana exactly as pronounced, never corrected to a likely word.'),
});

/** Folds any katakana to hiragana (same sounds) and removes spaces; never changes a sound. */
export function toHiragana(text: string): string {
  return text
    .replace(/\s+/g, '')
    .replace(/[ァ-ヶ]/g, (char) => String.fromCharCode((char.codePointAt(0) ?? 0) - 0x60));
}

/** Normalises the transcription to hiragana. */
export function finalizeTranscription(
  raw: z.output<typeof transcriptionSchema>,
): Promise<Transcription> {
  return Promise.resolve({ kana: toHiragana(raw.kana) });
}
