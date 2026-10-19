import type { Prompt } from '../task-def.ts';
import type { FollowUpInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE, sentenceLines, TUTOR } from './shared.ts';

const ASKS: Record<FollowUpInput['kind'], string> = {
  compare: 'Compare the two confused forms side by side: shape, meaning, readings, one word each.',
  example:
    'Give one more short example sentence with the same word, in "example", and one line on it.',
  simpler: 'Say the previous explanation again more simply, in one or two short sentences.',
  quiz: 'Write one multiple-choice question that checks the point, in "quiz", with a one-line lead-in.',
};

/** A3: the follow-up chips under an explanation. */
export const followUpPrompt: Prompt<FollowUpInput> = {
  version: 3,
  system: joinLines(
    TUTOR,
    'The learner tapped a follow-up chip under an explanation. Do only what the chip asks, and',
    'keep to the same sentence and word. Use words the learner reads well.',
    READINGS_RULE,
  ),
  build: (input, profile) =>
    joinLines(
      `Follow-up: ${input.kind}`,
      ASKS[input.kind],
      input.surface ? `Target: ${input.surface}` : undefined,
      sentenceLines(input.sentence),
      `Previous explanation: ${input.previous}`,
      profileLines(profile),
    ),
};
