import type { Prompt } from '../task-def.ts';
import type { BlankHint, ExplainSentenceInput, HiddenTarget } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE, sentenceLines, TUTOR } from './shared.ts';

function hiddenLine(target: HiddenTarget): string {
  return `${target.surface} (never write: ${target.readings.join(', ')})`;
}

/** A19: what the learner sees, the hidden answer, and what to do with it. */
function blankLine(blank: BlankHint | undefined): string | undefined {
  if (!blank) return undefined;
  return `Blank exercise. The learner sees: ${blank.shown}. Hidden answer (never write it): ${blank.answer}`;
}

/** L3: the meaning and grammar of a sentence, before the learner reads its targets aloud. */
export const explainSentencePrompt: Prompt<ExplainSentenceInput> = {
  version: 3,
  system: joinLines(
    TUTOR,
    'The learner is about to type the reading of the underlined words in this sentence and asked',
    'what the sentence means. In "meaning", say what it says and how it is built, in two or three',
    'sentences at their level. In "grammar", give one short note per grammar point listed, named',
    'by its pattern, about how it works in this sentence.',
    'Never give away how the hidden words are read: no kana, furigana, romaji or "read as" for',
    'them or for their kanji, and no example words that share their kanji. Refer to them as',
    'written in kanji. Other words may have readings.',
    'For a blank exercise you get the whole sentence and the hidden answer. The learner sees the',
    'sentence with a blank and must choose what fills it. Give a hint that steers toward the',
    'answer without saying it: what the words around the blank need, what kind of word or form',
    'fits, and the situation the sentence describes. Never write the answer, any form of it, its',
    'reading or its translation, and never treat the sentence as incomplete or a placeholder.',
    READINGS_RULE,
  ),
  build: (input, profile) =>
    joinLines(
      blankLine(input.blank),
      `Hidden: ${input.hidden.map(hiddenLine).join('; ') || 'none'}`,
      sentenceLines(input.sentence),
      input.grammar.length > 0
        ? `Grammar in it: ${input.grammar.map((g) => `${g.pattern} (${g.meaning})`).join('; ')}`
        : undefined,
      profileLines(profile),
    ),
};
