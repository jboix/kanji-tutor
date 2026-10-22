import type { Prompt } from '../task-def.ts';
import type { HandwritingInput } from '../types.ts';
import { joinLines } from './shared.ts';

/** I4: the Gemini fallback for handwriting lookup. */
export const recognizeHandwritingPrompt: Prompt<HandwritingInput> = {
  version: 2,
  system: joinLines(
    'You recognise one handwritten kanji drawn on a phone by a learner, in any stroke order.',
    'Return up to five single kanji it could be, best first, including close lookalikes.',
    'Reply with JSON only.',
  ),
  build: () => 'Which kanji is drawn in this image?',
};
