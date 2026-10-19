/**
 * The week in numbers for the weekly notes (A7): counts computed from the learner's own reviews,
 * so the letter can quote them and the plan can follow them. The AI only words these numbers.
 */
import { isoWeek, itemId, parseItemId } from '../ids.ts';
import { toKanaFold } from '../kana.ts';
import type { Repos } from '../repos.ts';
import { SECONDS_PER_SENTENCE } from '../scheduler.ts';
import type { ErrorType, Review } from '../types.ts';
import { isGrammarUsed, lessonGrammar } from './grammar.ts';

/** One missed reading: what was written, what it should have been. */
export interface MissExample {
  surface: string;
  expected: string;
  given: string;
}

/**
 * The stats the letter is written from. Same shape as `WeekStats` in `src/ai/types.ts`, so the
 * feature can pass it to `weeklyNotes` as is.
 */
export interface WeekStats {
  /** ISO week, e.g. "2026-W42". */
  week: string;
  /** Sentences read: distinct sentences per day with at least one answer. */
  sentencesRead: number;
  /** Of those, sentences where every reading was right. */
  correct: number;
  /** Misses (near-miss or wrong) by error type; kana variants are right answers. */
  byErrorType: Partial<Record<ErrorType, number>>;
  /** Up to four misses, the most frequent error type first. */
  missExamples: MissExample[];
  /** Patterns of the lesson's grammar points not yet used in Use it, e.g. "〜わけではない". */
  unusedGrammar: string[];
  lesson?: string;
}

/** The stats plus what the plan needs and the screen shows. */
export interface WeekReport {
  stats: WeekStats;
  /** Monday 00:00 and the next Monday 00:00, local time (epoch ms). */
  start: number;
  end: number;
  /** Ids of the grammar points in `stats.unusedGrammar`, same order. */
  unusedGrammarIds: string[];
  /** Days of the week with at least one answer. */
  activeDays: number;
  /** Rough reading minutes per active day (20 s a sentence), 0 for an empty week. */
  minutesPerDay: number;
}

const DAY_MS = 86_400_000;
const MAX_EXAMPLES = 4;
const MAX_GRAMMAR = 3;

/** Monday 00:00 of the week containing `now`, and the next Monday, in local time. */
export function weekBounds(now: number): { week: string; start: number; end: number } {
  const date = new Date(now);
  const back = (date.getDay() + 6) % 7;
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - back);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
  return { week: isoWeek(start), start: start.getTime(), end: end.getTime() };
}

/** The ISO week after the one containing `now`, e.g. "2026-W43" on any day of W42. */
export function nextWeekId(now: number): string {
  return isoWeek(new Date(weekBounds(now).end));
}

function isMiss(review: Review): boolean {
  return review.verdict !== 'correct';
}

/** One reading of a sentence on a given day; answers without a sentence count by item. */
function readKey(review: Review, start: number): string {
  const day = Math.floor((review.at - start) / DAY_MS);
  return `${review.sentenceId ?? review.itemId}@${day}`;
}

function reads(reviews: readonly Review[], start: number): Map<string, Review[]> {
  const groups = new Map<string, Review[]>();
  for (const review of reviews) {
    const key = readKey(review, start);
    groups.set(key, [...(groups.get(key) ?? []), review]);
  }
  return groups;
}

function countByType(reviews: readonly Review[]): Partial<Record<ErrorType, number>> {
  const counts: Partial<Record<ErrorType, number>> = {};
  for (const review of reviews.filter(isMiss)) {
    const type = review.errorType ?? 'other';
    counts[type] = (counts[type] ?? 0) + 1;
  }
  return counts;
}

/** Error types by count, most frequent first; ties keep the order they first appear. */
export function rankedErrorTypes(byErrorType: WeekStats['byErrorType']): ErrorType[] {
  const entries = Object.entries(byErrorType) as [ErrorType, number][];
  return entries
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([type]) => type);
}

async function surfaceOf(repos: Repos, review: Review): Promise<string> {
  const { ref } = parseItemId(review.itemId);
  const sentence = review.sentenceId ? await repos.sentences.get(review.sentenceId) : undefined;
  const token = sentence?.tokens.find((t) => t.wordId === ref);
  if (token) return token.surface;
  const word = await repos.dictionary.word(ref);
  return word?.forms[0] ?? word?.readings[0] ?? review.expected;
}

async function missExamples(repos: Repos, reviews: readonly Review[], order: ErrorType[]) {
  const misses = reviews.filter(isMiss).sort((a, b) => b.at - a.at);
  const rank = (r: Review) => order.indexOf(r.errorType ?? 'other');
  const ordered = [...misses].sort((a, b) => rank(a) - rank(b));
  const examples: MissExample[] = [];
  for (const review of ordered) {
    if (examples.length >= MAX_EXAMPLES) break;
    const surface = await surfaceOf(repos, review);
    if (examples.some((e) => e.surface === surface)) continue;
    examples.push({ surface, expected: review.expected, given: toKanaFold(review.answer) });
  }
  return examples;
}

async function unusedGrammar(repos: Repos) {
  const points = await lessonGrammar(repos);
  const items = await repos.items.getMany(points.map((p) => itemId('grammar', p.id)));
  return points.filter((_, i) => !isGrammarUsed(items[i])).slice(0, MAX_GRAMMAR);
}

/**
 * This week's stats (A7) from the reviews between Monday 00:00 and Sunday 24:00 local time of
 * the week containing `now`: sentences read and read right, misses by error type with real
 * examples (most frequent type first), and the current lesson's grammar not yet used.
 */
export async function weekStats(repos: Repos, options: { now: number }): Promise<WeekReport> {
  const { week, start, end } = weekBounds(options.now);
  const reviews = (await repos.reviews.since(start)).filter((r) => r.at < end);
  const groups = reads(reviews, start);
  const byErrorType = countByType(reviews);
  const points = await unusedGrammar(repos);
  const { currentLesson } = await repos.settings.get();
  const stats: WeekStats = {
    week,
    sentencesRead: groups.size,
    correct: [...groups.values()].filter((g) => !g.some(isMiss)).length,
    byErrorType,
    missExamples: await missExamples(repos, reviews, rankedErrorTypes(byErrorType)),
    unusedGrammar: points.map((p) => p.pattern),
  };
  if (currentLesson !== undefined) stats.lesson = currentLesson;
  const days = new Set(reviews.map((r) => Math.floor((r.at - start) / DAY_MS))).size;
  const minutesPerDay = days === 0 ? 0 : (groups.size * SECONDS_PER_SENTENCE) / 60 / days;
  const unusedGrammarIds = points.map((p) => p.id);
  return { stats, start, end, unusedGrammarIds, activeDays: days, minutesPerDay };
}
