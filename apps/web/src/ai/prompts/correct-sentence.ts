import type { Prompt } from '../task-def.ts';
import type { CorrectSentenceInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE, TUTOR } from './shared.ts';

/** A6: red-pen corrections, errors separate from style notes. */
export const correctSentencePrompt: Prompt<CorrectSentenceInput> = {
  version: 5,
  system: joinLines(
    TUTOR,
    'The learner wrote one sentence using a target grammar point. Correct it like a teacher with',
    'a red pen: change as little as possible. Each mark is an insert, replace or delete. Copy the',
    'exact text it covers into original (empty for an insertion) and up to three characters just',
    "before it into before, then give UTF-16 offsets into the learner's sentence exactly as given",
    '(end equals start for an insertion). Use severity "error" for what is wrong and "style" for',
    'what is correct but could read better. Give each mark a short title and a one- or two-sentence',
    'note. Say whether the target grammar is used. Then give a verdict: "natural" when nothing is',
    'wrong (style notes at most), "needs-work" when errors need a small fix, "not-yet" when the',
    'sentence does not say what was meant or misses the grammar point. In works, say in one or',
    'two sentences what the sentence gets right, naming the grammar. In next, suggest one',
    'concrete thing to try with the same point, such as a longer or more personal sentence;',
    'leave it empty when there is nothing worth adding.',
    READINGS_RULE,
  ),
  build: (input, profile) =>
    joinLines(
      `Grammar: ${input.grammar.pattern} (${input.grammar.meaning})`,
      `Learner sentence: ${input.sentence}`,
      profileLines(profile),
    ),
};
