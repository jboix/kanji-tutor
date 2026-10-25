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

/** A unit's items practised, out of all of them: plain counts for its progress line. */
export interface Practised {
  done: number;
  total: number;
  /** Opened or practised at all: before that the line says "Not started". */
  started: boolean;
}

type PractisedInput = Pick<UnitView, 'words' | 'grammar' | 'state' | 'skipped' | 'progress'>;

/**
 * The unit's words met in a session and grammar points reviewed right, out of its words and
 * points. A done unit (by the done rule or marked done) counts every item; a skipped one keeps
 * its own counts.
 */
export function unitPractised(view: PractisedInput): Practised {
  const { words, grammar, progress } = view;
  const total = words.total + grammar.total;
  const done = view.state === 'done' && !view.skipped ? total : words.met + grammar.reviewed;
  const opened = progress.introducedAt !== undefined || progress.readAt !== undefined;
  return { done, total, started: done > 0 || opened || view.state === 'done' };
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
