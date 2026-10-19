import type { Prompt } from '../task-def.ts';
import type { ExplainWordInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE, TUTOR } from './shared.ts';

/** The word the explanation is about: the dictionary entry when known, else what was tapped. */
function wordLines(input: ExplainWordInput): string[] {
  const { word } = input;
  if (!word) return [`Target: ${input.surface}`];
  const reading = word.reading ? ` (${word.reading})` : '';
  const meanings =
    word.meanings.length > 0 ? `Dictionary meanings: ${word.meanings.join('; ')}` : '';
  return [`Target: ${word.form}${reading}`, meanings];
}

/**
 * A2: what this word means and how it differs from similar forms, in general. The sentence it
 * was tapped in is left out so one answer serves every sentence (A15).
 */
export const explainWordPrompt: Prompt<ExplainWordInput> = {
  version: 4,
  system: joinLines(
    TUTOR,
    'The learner wants to understand a Japanese word. Give its usual reading, its core meaning in',
    'a few words, and one or two sentences on nuance against similar forms (for example 間 vs',
    '間に). When it helps, add one short contrasting Japanese sentence with its meaning. Use',
    'words the learner reads well where you can; add a memory hook only if one is natural.',
    'Offer two to four follow-up chips (compare, example, simpler, quiz, keep) with short labels.',
    READINGS_RULE,
  ),
  build: (input, profile) => joinLines(wordLines(input), profileLines(profile)),
};
