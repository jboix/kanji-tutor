/** Per-area notes after a placement (A11): plain lines on what was steady, never a score. */
import type { LearnerLevel } from '../types.ts';
import {
  type LevelTally,
  PLACEMENT_KINDS,
  type PlacementKind,
  type PlacementStep,
  tallyByLevel,
} from './staircase.ts';

/**
 * What an area's note says, worded by the UI (D52): steady at one level and not yet at a harder
 * one ("Kanji readings: steady at N5; N4 not yet."), steady up to a level, or not yet steady.
 */
export type AreaNote =
  | { kind: PlacementKind; status: 'steady-shaky'; steady: LearnerLevel; shaky: LearnerLevel }
  | { kind: PlacementKind; status: 'steady'; steady: LearnerLevel }
  | { kind: PlacementKind; status: 'not-yet'; level: LearnerLevel };

const harder = (a: LearnerLevel, b: LearnerLevel) => a < b;

/** The hardest level with more right than wrong answers. */
function steadyAt(tallies: readonly LevelTally[]): LearnerLevel | undefined {
  const levels = tallies.filter((t) => t.right * 2 > t.total).map((t) => t.level);
  return levels.reduce<LearnerLevel | undefined>(
    (acc, level) => (acc === undefined || harder(level, acc) ? level : acc),
    undefined,
  );
}

/** The easiest level, harder than `steady`, with as many wrong answers as right ones. */
function shakyAt(tallies: readonly LevelTally[], steady: LearnerLevel | undefined) {
  const shaky = tallies.filter(
    (t) =>
      t.total > 0 && t.right * 2 <= t.total && (steady === undefined || harder(t.level, steady)),
  );
  return shaky[0]?.level;
}

function line(kind: PlacementKind, steady?: LearnerLevel, shaky?: LearnerLevel): AreaNote {
  if (steady && shaky) return { kind, status: 'steady-shaky', steady, shaky };
  if (steady) return { kind, status: 'steady', steady };
  return { kind, status: 'not-yet', level: shaky ?? 5 };
}

/** One note per area that had questions, in the placement's order. */
export function areaNotes(steps: readonly PlacementStep[]): AreaNote[] {
  return PLACEMENT_KINDS.flatMap((kind) => {
    const mine = steps.filter((step) => step.kind === kind);
    if (mine.length === 0) return [];
    const tallies = tallyByLevel(mine);
    const steady = steadyAt(tallies);
    return [line(kind, steady, shakyAt(tallies, steady))];
  });
}
