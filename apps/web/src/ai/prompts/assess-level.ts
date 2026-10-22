import type { Prompt } from '../task-def.ts';
import type { AssessLevelInput, PlacementAnswer } from '../types.ts';
import { joinLines, READINGS_RULE, TUTOR } from './shared.ts';

const KIND: Record<PlacementAnswer['kind'], string> = {
  'kanji-reading': 'reading',
  orthography: 'spelling',
  'grammar-form': 'grammar',
  comprehension: 'comprehension',
};

function answerLine(answer: PlacementAnswer): string {
  const mark = answer.right ? 'right' : 'wrong';
  return `- N${answer.level} ${KIND[answer.kind]}, ${mark}: ${answer.item}`;
}

/** A11: a level assessment from a short placement, like a teacher would give. */
export const assessLevelPrompt: Prompt<AssessLevelInput> = {
  version: 2,
  system: joinLines(
    TUTOR,
    "Assess the learner's JLPT level (N5, N4 or N3) from a short placement: adaptive questions",
    'that moved up after two right answers at a level and down after two wrong, and an optional',
    'short written answer. Use your tools to see what the learner already knows. Give the level',
    'they should work on now, two or three strengths and two or three gaps as short phrases, and',
    'notes of two or three sentences. This is not a test result: no score, no grade, no praise.',
    'Judge the written answer on what it shows (vocabulary, grammar, kanji), not on its length.',
    READINGS_RULE,
  ),
  build: (input) =>
    joinLines(
      `The staircase alone proposes N${input.staircaseLevel}.`,
      'Answers:',
      input.answers.map(answerLine),
      input.writingPrompt ? `Writing prompt: ${input.writingPrompt}` : undefined,
      input.written ? `Written answer: ${input.written}` : 'No written answer.',
    ),
};
