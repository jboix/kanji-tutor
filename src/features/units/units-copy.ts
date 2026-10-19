/** Plain copy for the lesson path (T3, T4): states and counts, never praise (no gamification). */
import type { LevelUnits, UnitState, UnitStep, UnitView } from '../../domain/services/index.ts';
import type { PlainKey, Translate } from '../../ui/i18n/types.ts';

const STEP: Record<UnitStep, PlainKey> = {
  words: 'units.stepWords',
  grammar: 'units.stepGrammar',
  practice: 'units.stepPractice',
  reading: 'units.stepReading',
  review: 'units.stepReview',
  done: 'units.stepDone',
};

const STATE: Record<UnitState, PlainKey> = {
  done: 'units.stateDone',
  current: 'units.stateCurrent',
  open: 'units.stateOpen',
  'not-started': 'units.stateNotStarted',
};

/** "Practise", the step's name. */
export function stepName(t: Translate, step: UnitStep): string {
  return t(STEP[step]);
}

/** The unit's state line on the path: "Current · Practise", "Review · Not started", "Skipped". */
export function stateLine(t: Translate, view: UnitView): string {
  if (view.skipped) return t('units.skipped');
  const state = t(STATE[view.state]);
  const started = view.state === 'current' || view.state === 'open';
  const withStep = started ? t('units.withStep', { state, step: stepName(t, view.step) }) : state;
  return view.review && view.state !== 'done' ? t('units.review', { state: withStep }) : withStep;
}

/**
 * "6 of 13 words · 1 of 3 grammar": the unit's own progress (T7). Words drop out when the
 * installed packs lack the unit, so there are none to count yet.
 */
export function progressLine(t: Translate, view: UnitView): string {
  const { words, grammar } = view;
  const points = t('units.grammarOf', { known: grammar.reviewed, total: grammar.total });
  if (words.total === 0) return points;
  const known = t('units.wordsOf', { known: words.known, n: words.total });
  return t('units.counts', { words: known, grammar: points });
}

/** "5 of 12 done", with "· 1 in progress" when a unit of the level is started. */
export function levelLine(t: Translate, { done, started, total }: LevelUnits): string {
  const line = t('units.levelDone', { done, total });
  return started > 0 ? t('units.levelStarted', { line, n: started }) : line;
}
