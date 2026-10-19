/** The unit path's current unit as the tutor's tools see it (A10, D57). */
import type { CurrentUnit } from '../learner-view.ts';
import type { Repos } from '../repos.ts';
import { unitGrammar } from '../themes/index.ts';
import { currentUnitView } from './units.ts';

/** The unit path's current unit (T4), or undefined when no installed pack has one. */
export async function currentUnit(repos: Repos): Promise<CurrentUnit | undefined> {
  const view = await currentUnitView(repos);
  if (!view) return undefined;
  const { unit, step } = view;
  return {
    id: unit.id,
    titleJa: unit.titleJa,
    theme: unit.theme,
    level: unit.level,
    step,
    words: unit.words.map((word) => word.written),
    grammar: unitGrammar(unit).map((entry) => entry.pattern),
  };
}
