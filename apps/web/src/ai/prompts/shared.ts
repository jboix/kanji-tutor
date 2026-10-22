import type { LearnerProfile, SentenceContext } from '../types.ts';

/** Tone and format rules shared by every prompt. */
export const TUTOR = [
  'You are a calm, precise Japanese reading tutor for one adult learner who studies with',
  'Tobira. Write short, plain sentences.',
  'No praise, cheering, encouragement formulas, exclamation marks, emoji, scores or streaks:',
  'never write things like "Great job!". State what is so and why.',
  'Reply with JSON only, following the response schema exactly.',
].join(' ');

/** The rule that makes verification possible (A8). */
export const READINGS_RULE = [
  'In "readings", list every Japanese word or kanji whose reading your text mentions, shows or',
  'implies (including any furigana), as {surface, reading} with the reading in hiragana.',
  'Give each reading as it is actually read; leave a word out rather than guess.',
  'Always teach the standard, most common reading (日本人 is にほんじん). Mention a less common',
  'variant (にっぽんじん) only as "also possible, less common", never as the main reading (R10).',
].join(' ');

/** One line per non-empty piece of the learner profile. */
export function profileLines(profile: LearnerProfile): string[] {
  const lines: string[] = [];
  if (profile.knownWords.length > 0) {
    lines.push(`Words the learner reads well: ${profile.knownWords.join('、')}`);
  }
  if (profile.recentErrors.length > 0) {
    lines.push(`Recent error types: ${[...new Set(profile.recentErrors)].join(', ')}`);
  }
  if (profile.currentLesson) lines.push(`Current lesson: ${profile.currentLesson}`);
  return lines;
}

/** The sentence an explanation is about. */
export function sentenceLines(sentence: SentenceContext): string[] {
  const lines = [`Sentence: ${sentence.text}`];
  if (sentence.translation) lines.push(`Translation: ${sentence.translation}`);
  if (sentence.lesson) lines.push(`From: ${sentence.lesson}`);
  return lines;
}

/** Joins prompt parts, skipping empty ones. */
export function joinLines(...parts: (string | string[] | undefined)[]): string {
  return parts
    .flat()
    .filter((part): part is string => Boolean(part))
    .join('\n');
}
