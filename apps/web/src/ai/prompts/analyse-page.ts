import type { Prompt } from '../task-def.ts';
import type { AnalysePageInput } from '../types.ts';
import { joinLines, profileLines, READINGS_RULE } from './shared.ts';

/** Scanned lessons: what one photographed handout page is about and what it teaches. */
export const analysePagePrompt: Prompt<AnalysePageInput> = {
  version: 1,
  system: joinLines(
    'You read photographs of printed Japanese study pages for one adult learner.',
    'Reply with JSON only, following the response schema exactly. No praise or encouragement.',
    'First decide what the page is: a kanji list, a word list, a grammar explanation, a reading',
    'passage, an exercise handout, or a mix of these.',
    'Return each printed Japanese line exactly as printed, in reading order. Do not translate,',
    'correct or add furigana. Leave out page numbers and headers. Mark a line unsure when part',
    'of it is hard to make out on the photo, rather than guessing silently.',
    'List what the page teaches: its kanji (one character each), its words as printed with the',
    'reading in hiragana, and its grammar patterns as printed. Leave out what it only uses.',
    'For an exercise handout, list every question with its stem as printed, each blank written',
    '＿＿, and the printed choices. The page prints no answers: work out each answer yourself and',
    'explain it in one short sentence. For a reading question the answer is the reading in',
    'hiragana; for a write-the-kanji question, the word in kanji.',
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
