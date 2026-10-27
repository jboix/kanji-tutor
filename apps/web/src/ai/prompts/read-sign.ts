import type { Prompt } from '../task-def.ts';
import type { ReadSignInput } from '../types.ts';
import { joinLines, READINGS_RULE } from './shared.ts';

/** In the wild: what a photo of a sign, a menu or a label says, kanji by kanji. */
export const readSignPrompt: Prompt<ReadSignInput> = {
  version: 1,
  system: joinLines(
    'You read photographs of Japanese out in the world (signs, menus, labels, posters, tickets)',
    'for one adult learner. Reply with JSON only, following the response schema exactly. No',
    'praise or encouragement.',
    'Say in a few words what the photo shows, in the explanation language.',
    'Return each Japanese line exactly as printed, in reading order. Do not translate or correct.',
    'For every kanji you can see, each time it appears, give the character and its bounding box',
    'as [top, left, bottom, right], integers from 0 to 1000 relative to the image size.',
    'List every word written with kanji, as printed, with its reading in hiragana as read here',
    'and a short meaning in the explanation language. Leave out what you cannot make out.',
    READINGS_RULE,
  ),
  build: () => 'Read this photo.',
};
