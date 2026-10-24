/**
 * Progress shown with what it measures (T7), pure: one unit's share of the way to done, and a
 * level's unit counts. Built on the counts `unit-path.ts` already works out.
 */
import type { LearnerLevel } from '../types.ts';
import { LESSON_SECTIONS, sectionDone } from './lesson-sections.ts';
import type { UnitView } from './unit-path.ts';

type ShareInput = Pick<UnitView, 'words' | 'grammar' | 'state'>;

/**
 * How far a unit is, 0 to 1: its known words and right grammar points out of all of them. A done
 * unit (met, marked or skipped) is 1.
 */
export function unitShare({ words, grammar, state }: ShareInput): number {
  if (state === 'done') return 1;
  const total = words.total + grammar.total;
  return total > 0 ? (words.known + grammar.reviewed) / total : 0;
}

/**
 * How far through its lesson a unit is, 0 to 1: the sections done, with a started section's
 * parts counting towards it. A done unit is 1.
 */
export function sectionShare({ progress, state }: Pick<UnitView, 'progress' | 'state'>): number {
  if (state === 'done') return 1;
  const shares = LESSON_SECTIONS.map((section) => {
    const own = progress.sections?.[section];
    return own && own.parts > 0 ? Math.min(own.done / own.parts, 1) : 0;
  });
  return shares.reduce((sum, share) => sum + share, 0) / LESSON_SECTIONS.length;
}

/** The sections of a unit's lesson that are done, out of all of them. */
export function sectionsDone({ progress }: Pick<UnitView, 'progress'>): number {
  return LESSON_SECTIONS.filter((section) => sectionDone(progress.sections?.[section])).length;
}

/** A level's units: how many are done, started (introduced, not done), and in all (T4, T7). */
export interface LevelUnits {
  done: number;
  started: number;
  total: number;
}

/** Counts the units of one level on the path. */
export function levelUnits(views: readonly UnitView[], level: LearnerLevel): LevelUnits {
  const own = views.filter((view) => view.unit.level === level);
  return {
    done: own.filter((view) => view.state === 'done').length,
    started: own.filter((v) => v.state !== 'done' && v.progress.introducedAt !== undefined).length,
    total: own.length,
  };
}
