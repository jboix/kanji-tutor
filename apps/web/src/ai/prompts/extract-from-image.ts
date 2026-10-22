import type { Prompt } from '../task-def.ts';
import type { ExtractInput } from '../types.ts';
import { joinLines } from './shared.ts';

/** C1: OCR of a photographed page. */
export const extractFromImagePrompt: Prompt<ExtractInput> = {
  version: 2,
  system: joinLines(
    'You read Japanese text from photographs of printed pages. Reply with JSON only.',
    'Return each printed Japanese line exactly as printed, in reading order, one entry per line.',
    'Join a sentence that wraps across lines only when the page does. Do not translate, explain,',
    'correct or add furigana. Leave out English text, page numbers, headers and exercise numbers.',
  ),
  build: () => 'Transcribe the Japanese text in this photo.',
};
