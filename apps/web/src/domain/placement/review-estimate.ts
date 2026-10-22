/**
 * The quiet re-estimate (A11): from the last 30 days of reviews, the accuracy at each JLPT
 * level suggests a level. Today may show "Your reviews suggest N4"; the level itself only ever
 * changes when the learner changes it.
 */
import type { LearnerLevel } from '../types.ts';

export const ESTIMATE_WINDOW_MS = 30 * 86_400_000;
/** Reviews a level needs before its accuracy counts. */
export const MIN_REVIEWS = 12;
/** At or above this accuracy a level is solid; the learner can work on the next one. */
export const SOLID = 0.85;
/** Under this accuracy the level is too hard for now. */
export const SHAKY = 0.6;

/** One review with the JLPT level of what it asked (N2 and N1 count as N3). */
export interface LevelledReview {
  level: 5 | 4 | 3 | 2 | 1;
  correct: boolean;
}

interface Accuracy {
  level: LearnerLevel;
  share: number;
}

function accuracies(reviews: readonly LevelledReview[]): Accuracy[] {
  return ([5, 4, 3] as const).flatMap((level) => {
    const at = reviews.filter((r) => Math.max(3, r.level) === level);
    if (at.length < MIN_REVIEWS) return [];
    return [{ level, share: at.filter((r) => r.correct).length / at.length }];
  });
}

/**
 * The suggested level: one past the hardest solid level (N3 at most); else, when the hardest
 * level with enough reviews is shaky, the one below it. Undefined without enough reviews.
 */
export function levelFromReviews(reviews: readonly LevelledReview[]): LearnerLevel | undefined {
  const rows = accuracies(reviews);
  const solid = rows.filter((row) => row.share >= SOLID).map((row) => row.level);
  if (solid.length > 0) {
    const hardest = Math.min(...solid) as LearnerLevel;
    return hardest === 3 ? 3 : ((hardest - 1) as LearnerLevel);
  }
  const top = rows.at(-1);
  if (top && top.share < SHAKY && top.level < 5) return (top.level + 1) as LearnerLevel;
  return undefined;
}
