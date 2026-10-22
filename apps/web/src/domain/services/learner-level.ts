/**
 * The learner's level (P1, P4): the JLPT level they are working on. Starting from zero is
 * N5; a list marked as known moves the frontier one level up (N5 known → working on N4). An
 * import only ever raises the level, never lowers one the learner chose.
 */
import type { SettingsRepo } from '../repos.ts';
import type { LearnerLevel, Settings } from '../types.ts';

/** The levels a learner can work on, easiest first. */
export const LEARNER_LEVELS: readonly LearnerLevel[] = [5, 4, 3];

/** The learner's level, N5 when it was never set. */
export function learnerLevelOf(settings: Pick<Settings, 'learnerLevel'>): LearnerLevel {
  return settings.learnerLevel ?? 5;
}

/** The harder of two levels (N3 is harder than N5). */
export function harderLevel(a: LearnerLevel, b: LearnerLevel): LearnerLevel {
  return a < b ? a : b;
}

/**
 * The level a learner works on once these JLPT lists are known: N5 known → N4, N4 known
 * → N3 (the app stops at N3). Undefined when no list was applied.
 */
export function levelAfterLists(levels: readonly (5 | 4)[]): LearnerLevel | undefined {
  if (levels.length === 0) return undefined;
  return levels.includes(4) ? 3 : 4;
}

/** Raises the stored level to at least `level`; returns the level now stored. */
export async function raiseLearnerLevel(
  settings: SettingsRepo,
  level: LearnerLevel,
): Promise<LearnerLevel> {
  const current = await settings.get();
  const next =
    current.learnerLevel === undefined ? level : harderLevel(current.learnerLevel, level);
  if (next !== current.learnerLevel) await settings.patch({ learnerLevel: next });
  return next;
}
