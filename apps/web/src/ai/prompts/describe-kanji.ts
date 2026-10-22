import type { Prompt } from '../task-def.ts';
import type { DescribeKanjiInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE } from './shared.ts';

/** I5: find a kanji from a description. */
export const describeKanjiPrompt: Prompt<DescribeKanjiInput> = {
  version: 4,
  system: joinLines(
    'You help a Japanese learner find a kanji from a loose description of its shape, parts or',
    'meaning. Return up to five single kanji, best first, each with a few words on why it fits.',
    'Prefer kanji in words the learner reads well. Reply with JSON only.',
    READINGS_RULE,
  ),
  build: (input, profile) => joinLines(`Description: ${input.description}`, profileLines(profile)),
};
