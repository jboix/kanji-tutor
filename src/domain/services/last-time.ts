/**
 * Today's "Last time" line (IA2): what the learner did on their latest day of practice, from the
 * reviews alone, no AI. Plain counts: sentences read, read right, and the most frequent slip.
 */
import type { ErrorType, Review } from '../types.ts';

export interface LastTime {
  /** Days before today: 0 today, 1 yesterday. */
  daysAgo: number;
  /** Sentences (or items answered without one) read that day. */
  sentences: number;
  /** Of those, read with no miss. */
  right: number;
  /** The most frequent slip that day, how often, and its latest example (しょ for しょう). */
  miss?: { type: ErrorType; count: number; given: string; expected: string };
}

/** Local midnight of the day containing `at`, and of the next day. */
function dayOf(at: number): { start: number; end: number } {
  const date = new Date(at);
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return { start: start.getTime(), end: end.getTime() };
}

function topMiss(reviews: readonly Review[]): LastTime['miss'] {
  const byType = new Map<ErrorType, Review[]>();
  for (const review of reviews) {
    if (review.verdict === 'correct' || review.skipped) continue;
    const type = review.errorType ?? 'other';
    byType.set(type, [...(byType.get(type) ?? []), review]);
  }
  const [top] = [...byType].sort((a, b) => b[1].length - a[1].length);
  if (!top) return undefined;
  const [type, list] = top;
  const latest = list.reduce((a, b) => (b.at > a.at ? b : a));
  return { type, count: list.length, given: latest.answer, expected: latest.expected };
}

/** The latest day with reviews, as Today's last-time line; undefined with none. */
export function lastTime(reviews: readonly Review[], now: number): LastTime | undefined {
  if (reviews.length === 0) return undefined;
  const latest = Math.max(...reviews.map((r) => r.at));
  const { start, end } = dayOf(latest);
  const day = reviews.filter((r) => r.at >= start && r.at < end);
  const reads = new Map<string, boolean>();
  for (const review of day) {
    const key = review.sentenceId ?? review.itemId;
    reads.set(key, (reads.get(key) ?? true) && review.verdict === 'correct');
  }
  const daysAgo = Math.round((dayOf(now).start - start) / 86_400_000);
  const result: LastTime = {
    daysAgo: Math.max(0, daysAgo),
    sentences: reads.size,
    right: [...reads.values()].filter(Boolean).length,
  };
  const miss = topMiss(day);
  if (miss) result.miss = miss;
  return result;
}
