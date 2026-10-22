import type { Prompt } from '../task-def.ts';
import type { ExplainMistakeInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE, sentenceLines, TUTOR } from './shared.ts';

/** Slips the grading names well enough that the answer and sentence add nothing (A15). */
export function isNamedSlip(input: Pick<ExplainMistakeInput, 'errorType'>): boolean {
  return input.errorType !== undefined && input.errorType !== 'other';
}

function slipLines(input: ExplainMistakeInput): (string | string[] | undefined)[] {
  if (!isNamedSlip(input)) {
    return [`Learner answered: ${input.answer}`, sentenceLines(input.sentence)];
  }
  const { confused } = input;
  return [
    `Error type (from grading): ${input.errorType}`,
    confused && `Confused kanji: ${confused.kanji} read as ${confused.lookalike}`,
  ];
}

/**
 * A1, A5: explain this kind of error on this word, with words the learner knows. Only the keyed
 * fields are sent (A15), target first so the mock can match it.
 */
export const explainMistakePrompt: Prompt<ExplainMistakeInput> = {
  version: 4,
  system: joinLines(
    TUTOR,
    'The learner typed the reading of a word and got it wrong. In two or three sentences,',
    'explain this error only: name the kanji they confused it with and the part (radical) that',
    'tells them apart, or the long vowel, small っ or voicing they missed.',
    'Address the learner as "you". When a word the learner reads well shares a kanji or a sound,',
    'give a one-line memory hook built from it (for example 一緒 いっしょ → 一生 いっしょう).',
    'Offer two to four follow-up chips (compare, example, simpler, quiz, keep) with short labels',
    'that name the actual kanji or word, such as "待 and 持 side by side".',
    READINGS_RULE,
  ),
  build: (input, profile) =>
    joinLines(
      `Target: ${input.target.surface}`,
      `Correct reading: ${input.target.expected}`,
      ...slipLines(input),
      profileLines(profile),
    ),
};
