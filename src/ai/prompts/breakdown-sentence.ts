import type { Prompt } from '../task-def.ts';
import type { BreakdownInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE, sentenceLines, TUTOR } from './shared.ts';

/**
 * A2: the sentence chunk by chunk. The tapped word is not sent: one breakdown serves every word
 * of the sentence (A15), and the app marks the chunk that holds it.
 */
export const breakdownSentencePrompt: Prompt<BreakdownInput> = {
  version: 4,
  system: joinLines(
    TUTOR,
    'Split the sentence into three to six meaningful chunks, in order, copying the text exactly so',
    'the chunks join back into the sentence. Give each a short gloss. Add a natural translation.',
    READINGS_RULE,
  ),
  build: (input, profile) => {
    const { text, translation } = input.sentence;
    const sentence = translation === undefined ? { text } : { text, translation };
    return joinLines(sentenceLines(sentence), profileLines(profile));
  },
};
