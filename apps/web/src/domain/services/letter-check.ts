/**
 * Checks an AI-written weekly letter against the stats it was written from (A7): every number in
 * digits and every Japanese phrase it quotes must come from the stats. The numbers are the
 * learner's real counts, and the Japanese is real missed words, the readings they typed and the
 * dictionary readings they should have typed, or grammar patterns of the lesson.
 */
import type { WeekStats } from './week-stats.ts';

const JAPANESE = /[々぀-ヿ㐀-鿿ｦ-ﾟ〜～]+/gu;
const DIGITS = /\d+/g;

function statNumbers(stats: WeekStats): Set<number> {
  const misses = Object.values(stats.byErrorType).reduce((a, b) => a + b, 0);
  const counts = [
    stats.sentencesRead,
    stats.correct,
    stats.sentencesRead - stats.correct,
    misses,
    stats.missExamples.length,
    stats.unusedGrammar.length,
    ...Object.values(stats.byErrorType),
  ];
  if (stats.sentencesRead > 0) counts.push(Math.round((stats.correct / stats.sentencesRead) * 100));
  const inText = `${stats.week} ${stats.lesson ?? ''}`.match(DIGITS) ?? [];
  return new Set([...counts, ...inText.map(Number)]);
}

function statPhrases(stats: WeekStats): string[] {
  const examples = stats.missExamples.flatMap((e) => [e.surface, e.expected, e.given]);
  return [...examples, ...stats.unusedGrammar, stats.lesson ?? ''].map(bare);
}

/** Without a leading 〜, so "わけではない" matches the pattern "〜わけではない". */
function bare(text: string): string {
  return text.replace(/^[〜～]+/u, '');
}

/**
 * The claims in `letter` that are not in `stats`: numbers written in digits that are none of
 * the counts (or `extraNumbers`, e.g. the dates of the week), and Japanese runs that are not
 * part of any missed word, reading, grammar pattern or the lesson tag. Empty when grounded.
 * Numbers spelled out in words are not checked.
 */
export function ungroundedClaims(
  letter: readonly string[],
  stats: WeekStats,
  extraNumbers: readonly number[] = [],
): string[] {
  const text = letter.join('\n');
  const numbers = new Set([...statNumbers(stats), ...extraNumbers]);
  const phrases = statPhrases(stats);
  const badNumbers = (text.match(DIGITS) ?? []).filter((n) => !numbers.has(Number(n)));
  const badJapanese = (text.match(JAPANESE) ?? []).filter(
    (run) => !phrases.some((phrase) => phrase.includes(bare(run))),
  );
  return [...new Set([...badNumbers, ...badJapanese])];
}
