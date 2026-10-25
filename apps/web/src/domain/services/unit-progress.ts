/**
 * Progress shown with what it measures (T7), pure: one unit's items practised and its sections
 * done, and a level's unit counts. Built on the counts `unit-path.ts` already works out.
 */
import type { LearnerLevel } from '../types.ts';
import { LESSON_SECTIONS, sectionDone } from './lesson-sections.ts';
import type { UnitView } from './unit-path.ts';

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

/** When the unit's lesson was last practised: its latest section part or passage read. */
export function lastPractised({ progress }: Pick<UnitView, 'progress'>): number | undefined {
  const times = [
    progress.readAt,
    ...Object.values(progress.sections ?? {}).map((section) => section?.at),
  ].filter((at): at is number => at !== undefined);
  return times.length > 0 ? Math.max(...times) : undefined;
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
