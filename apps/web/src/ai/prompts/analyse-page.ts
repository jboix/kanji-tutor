import type { Prompt } from '../task-def.ts';
import type { AnalysePageInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE } from './shared.ts';

/** Scanned lessons: what one photographed handout page is about and what it teaches. */
export const analysePagePrompt: Prompt<AnalysePageInput> = {
  version: 3,
  system: joinLines(
    'You read photographs of printed Japanese study pages for one adult learner.',
    'Reply with JSON only, following the response schema exactly. No praise or encouragement.',
    'First decide what the page is: a kanji list, a word list, a grammar explanation, a reading',
    'passage, an exercise handout, or a mix of these.',
    'Then give the page from top to bottom as blocks, in the order it is printed: a heading, an',
    'instruction, an exercise, a list, a text. Keep that order even when it alternates:',
    'instruction, exercise, instruction, exercise. Leave nothing printed out but page numbers',
    'and running headers.',
    'In each block return every printed line exactly as printed. Do not translate, correct or',
    'add furigana. Mark a line unsure when part of it is hard to make out on the photo, rather',
    'than guessing silently.',
    'An instruction block holds the lines that only tell the learner what to do',
    '(正しいものを選びなさい). The exercise it introduces is the next block.',
    'For an exercise block, list every question with its stem as printed, each blank written',
    '＿＿, and the printed choices. The page prints no answers: work out each answer yourself and',
    'explain it in one short sentence. For a reading question the answer is the reading in',
    'hiragana; for a write-the-kanji question, the word in kanji.',
    'When an exercise fits none of the question types because it needs a picture, a table,',
    'sound, or lines to draw, do not force it into one and do not drop it: return it as an',
    'unsupported block with its printed lines and one short reason.',
    'List what the page teaches: its kanji (one character each), its words as printed with the',
    'reading in hiragana, and its grammar patterns as printed. Leave out what it only uses,',
    'and what only an exercise instruction uses.',
    'Suggest a short title for what the page teaches, like a lesson title.',
    READINGS_RULE,
  ),
  build: (input, profile) =>
    joinLines(
      `Page ${input.page} of ${input.pages} of one handout.`,
      'Read this page.',
      profileLines(profile),
    ),
};
