/**
 * Find my level (A11): a short adaptive placement. It starts at N5, moves up a level after
 * two right answers in a row and down after two wrong ones (a staircase), and proposes the level
 * just past the hardest one answered steadily. Pure; the result is a level and notes, never a
 * score.
 */
import type { LearnerLevel } from '../types.ts';

/** The question shapes the placement uses (J1, J2, J4, T6). */
export type PlacementKind = 'kanji-reading' | 'orthography' | 'grammar-form' | 'comprehension';

/** Kinds in the order they take turns. */
export const PLACEMENT_KINDS: readonly PlacementKind[] = [
  'kanji-reading',
  'grammar-form',
  'orthography',
  'comprehension',
];

/** About 15 questions, then the optional written answer. */
export const PLACEMENT_LENGTH = 15;
/** A level counts as steady from this share right, with at least two answers there. */
export const STEADY_SHARE = 0.75;
const MIN_AT_LEVEL = 2;

export interface PlacementStep {
  level: LearnerLevel;
  kind: PlacementKind;
  right: boolean;
}

export interface Staircase {
  level: LearnerLevel;
  /** Right answers in a row at this level (positive) or wrong ones (negative). */
  streak: number;
  steps: PlacementStep[];
}

export function startStaircase(): Staircase {
  return { level: 5, streak: 0, steps: [] };
}

function nextStreak(streak: number, right: boolean): number {
  if (right) return streak > 0 ? streak + 1 : 1;
  return streak < 0 ? streak - 1 : -1;
}

function moved(level: LearnerLevel, streak: number): { level: LearnerLevel; streak: number } {
  if (streak >= 2 && level > 3) return { level: (level - 1) as LearnerLevel, streak: 0 };
  if (streak <= -2 && level < 5) return { level: (level + 1) as LearnerLevel, streak: 0 };
  return { level, streak };
}

/** Records one answer at the current level and moves the staircase. */
export function answerStep(state: Staircase, kind: PlacementKind, right: boolean): Staircase {
  const steps = [...state.steps, { level: state.level, kind, right }];
  return { ...moved(state.level, nextStreak(state.streak, right)), steps };
}

/** The kind the next question should be. */
export function nextKind(state: Staircase): PlacementKind {
  return PLACEMENT_KINDS[state.steps.length % PLACEMENT_KINDS.length] ?? 'kanji-reading';
}

export function staircaseDone(state: Staircase): boolean {
  return state.steps.length >= PLACEMENT_LENGTH;
}

export interface LevelTally {
  level: LearnerLevel;
  right: number;
  total: number;
}

/** Answers per level, N5 first. */
export function tallyByLevel(steps: readonly PlacementStep[]): LevelTally[] {
  return ([5, 4, 3] as const).map((level) => {
    const at = steps.filter((step) => step.level === level);
    return { level, right: at.filter((step) => step.right).length, total: at.length };
  });
}

const steady = (tally: LevelTally) =>
  tally.total >= MIN_AT_LEVEL && tally.right / tally.total >= STEADY_SHARE;

/**
 * The level to work on: one past the hardest level answered steadily (N5 steady → N4), N3 at
 * most, N5 when no level was steady.
 */
export function proposedLevel(steps: readonly PlacementStep[]): LearnerLevel {
  const hardest = tallyByLevel(steps)
    .filter(steady)
    .reduce<LearnerLevel | undefined>(
      (acc, t) => (acc === undefined || t.level < acc ? t.level : acc),
      undefined,
    );
  if (hardest === undefined) return 5;
  return hardest === 3 ? 3 : ((hardest - 1) as LearnerLevel);
}
