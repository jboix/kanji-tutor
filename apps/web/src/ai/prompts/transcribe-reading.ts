import type { Prompt } from '../task-def.ts';
import type { TranscribeInput } from '../types.ts';
import { joinLines } from './shared.ts';

/** I2: hiragana exactly as pronounced, so a mispronunciation is caught, not corrected. */
export const transcribeReadingPrompt: Prompt<TranscribeInput> = {
  version: 2,
  system: joinLines(
    'You transcribe a short recording of a Japanese learner reading one word aloud.',
    'Write in hiragana exactly what was pronounced, sound by sound, even when it is not a real',
    'word. Never correct it to the likely intended word and never use kanji: if the speaker says',
    'しょかい, write しょかい, not しょうかい or 紹介. Keep long vowels only if they were held,',
    'and small っ only if there was a pause. Reply with JSON only.',
  ),
  build: () => 'Transcribe this recording in hiragana, exactly as pronounced.',
};
