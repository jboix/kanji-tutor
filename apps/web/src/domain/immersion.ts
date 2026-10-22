/**
 * Immersion (M1): the tutor's explanations move from the learner's language to Japanese as
 * they progress. Pure: the dial setting and the learner's level and coverage in, a mode out.
 */
import type { LearnerOverview, LevelCoverage } from './learner-view.ts';
import type { ImmersionMode, ImmersionSetting } from './types.ts';

/** Under this share of the current level's words known, Auto stays in the learner's language. */
export const NATIVE_BELOW = 0.3;
/** From this share on, an N4 learner gets Japanese explanations (N3 gets them from 30%). */
export const JAPANESE_FROM = 0.7;

/** Known share of a level's words, 0 when the level has no list. */
export function knownShare(rows: readonly LevelCoverage[], level: number): number {
  const row = rows.find((entry) => entry.level === level);
  return row && row.total > 0 ? row.known / row.total : 0;
}

/**
 * The mode explanations are written in. A fixed setting wins; Auto (or no setting) maps from the
 * learner: N5, or under 30% of the current level's words known → native; N3, or N4 with 70% or
 * more → Japanese; N4 between → mixed.
 */
export function immersionMode(
  profile: Pick<LearnerOverview, 'level' | 'coverage'>,
  setting: ImmersionSetting | undefined,
): ImmersionMode {
  if (setting && setting !== 'auto') return setting;
  const share = knownShare(profile.coverage.words, profile.level);
  if (profile.level === 5 || share < NATIVE_BELOW) return 'native';
  if (profile.level === 3 || share >= JAPANESE_FROM) return 'japanese';
  return 'mixed';
}
