import type { Prompt } from '../task-def.ts';
import type { ConversationTurn, QuestionInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE, sentenceLines, TUTOR } from './shared.ts';

/** Earlier turns, oldest first, each answer on one line. */
function historyLines(history: readonly ConversationTurn[] | undefined): string[] {
  if (!history?.length) return [];
  const turns = history.flatMap((turn) => [
    `Learner: ${turn.question}`,
    `Tutor: ${turn.answer.replace(/\s+/g, ' ')}`,
  ]);
  return ['Earlier in this conversation:', ...turns];
}

/** A4: a free question, scoped to the current sentence or word, in a running conversation. */
export const answerQuestionPrompt: Prompt<QuestionInput> = {
  version: 4,
  system: joinLines(
    TUTOR,
    "Answer the learner's question about this sentence or word in two to four sentences. Stay on",
    'the sentence and its grammar; if the question drifts away from it, answer briefly and bring',
    'it back. When earlier turns are given, build on them rather than repeat them.',
    READINGS_RULE,
  ),
  build: (input, profile) =>
    joinLines(
      input.surface ? `Target: ${input.surface}` : undefined,
      `Question (about the ${input.scope}): ${input.question}`,
      input.grammar ? `Grammar: ${input.grammar.pattern} (${input.grammar.meaning})` : undefined,
      sentenceLines(input.sentence),
      historyLines(input.history),
      profileLines(profile),
    ),
};
