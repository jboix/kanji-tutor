import type { Prompt } from '../task-def.ts';
import type { ParaphraseInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE, sentenceLines, TUTOR } from './shared.ts';

/** J6: a JLPT 言い換え類義 question on a phrase of the sentence. */
export const paraphraseQuestionPrompt: Prompt<ParaphraseInput> = {
  version: 2,
  system: joinLines(
    TUTOR,
    'Write one JLPT 言い換え類義 question: four short Japanese options, exactly one closest in',
    'meaning to the phrase in this sentence. The others are plausible but change the meaning.',
    "Use words and grammar at the learner's level; check with your tools. For each option, say in",
    'one short sentence why it is right or wrong. Give answerIndex from 0 to 3.',
    READINGS_RULE,
  ),
  build: (input, profile) =>
    joinLines(
      `Phrase: ${input.phrase ?? input.sentence.text}`,
      sentenceLines(input.sentence),
      profileLines(profile),
    ),
};
