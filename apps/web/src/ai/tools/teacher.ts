/** Teacher-tier pieces (A10): the tool rule and the learner snapshot for cache keys. */
import type { LearnerOverview, LearnerView, LevelCoverage } from '../../domain/learner-view.ts';

/** Added to the system instruction of teacher-tier requests that carry the tools. */
export const TEACHER_RULE = [
  "Before explaining, check the learner's level and which words they know; explain using known",
  'words and grammar; introduce at most one new item and mark it; match the explanation’s',
  'difficulty to the learner.',
  'Use the tools for this: get_learner_profile first, then check_known on the words you plan to',
  'use, lookup_word before you state a meaning or reading, and known_examples for examples and',
  'memory hooks. Mark the one new item by writing ［新］ right after it, e.g. 鉛筆［新］.',
  'Never invent what the learner knows: if a tool fails, explain simply without it.',
].join(' ');

/** The learner at the coarse grain that may change a cached answer. */
export interface LearnerSnapshot {
  /** Stable text folded into the cache key, e.g. "N4 w4 k3 g2". */
  key: string;
  /** A prompt line naming the level, so the model needs no tool call for it. */
  line: string;
  /** The level and coverage it came from, for the immersion mode (M1). */
  learner: Pick<LearnerOverview, 'level' | 'coverage'>;
}

/** Known share of a level in tenths, 0–10. */
function bucket(rows: readonly LevelCoverage[], level: number): number {
  const row = rows.find((entry) => entry.level === level);
  return row && row.total > 0 ? Math.floor((10 * row.known) / row.total) : 0;
}

/**
 * Level plus coverage buckets at that level, so a cached answer for a beginner is not reused once
 * they advance. Undefined when the view fails; the task then runs as if it had no learner.
 */
export async function learnerSnapshot(view: LearnerView): Promise<LearnerSnapshot | undefined> {
  try {
    const { level, levelSource, coverage } = await view.getLearnerProfile();
    const [w, k, g] = [coverage.words, coverage.kanji, coverage.grammar].map((rows) =>
      bucket(rows, level),
    );
    return {
      key: `N${level} w${w} k${k} g${g}`,
      line: `Learner level: N${level} (${levelSource}); about ${(w ?? 0) * 10}% of N${level} words known.`,
      learner: { level, coverage },
    };
  } catch {
    return undefined;
  }
}
