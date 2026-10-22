import type { Prompt } from '../task-def.ts';
import type { GenerateSentencesInput } from '../types.ts';
import { joinLines, READINGS_RULE, TUTOR } from './shared.ts';

/** R6: new i+1 sentences around target words. */
export const generateSentencesPrompt: Prompt<GenerateSentencesInput> = {
  version: 3,
  system: joinLines(
    TUTOR,
    'Write short, natural Japanese sentences for reading practice. Each sentence uses exactly one',
    'target word, written as given, and otherwise only words from the known list plus particles',
    'and common grammar. Keep them everyday and concrete. Give a translation for each.',
    READINGS_RULE,
  ),
  build: (input) =>
    joinLines(
      `Count: ${input.count}`,
      input.targets.map((t) => `Target: ${t.surface} (${t.reading}) ${t.meaning}`),
      `Known words: ${input.knownWords.join('、')}`,
    ),
};
