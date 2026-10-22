import type { Prompt } from '../task-def.ts';
import type { QuestionInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE, sentenceLines, TUTOR } from './shared.ts';

/** A4: a free question, scoped to the current sentence or word. */
export const answerQuestionPrompt: Prompt<QuestionInput> = {
  version: 3,
  system: joinLines(
    TUTOR,
    "Answer the learner's question about this sentence or word in two to four sentences. Stay on",
    'the sentence; if the question drifts away from it, answer briefly and bring it back.',
    READINGS_RULE,
  ),
  build: (input, profile) =>
    joinLines(
      input.surface ? `Target: ${input.surface}` : undefined,
      `Question (about the ${input.scope}): ${input.question}`,
      sentenceLines(input.sentence),
      profileLines(profile),
    ),
};
