/** The lesson path: every thematic unit in path order, N5 → N4 → N3 (T1, D33). */

import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import type { GrammarEntry } from '../grammar/types.ts';
import { N3_A } from './n3-a.ts';
import { N3_B } from './n3-b.ts';
import { N3_C } from './n3-c.ts';
import { N3_D } from './n3-d.ts';
import { N3_E } from './n3-e.ts';
import { N4_A } from './n4-a.ts';
import { N4_B } from './n4-b.ts';
import { N4_C } from './n4-c.ts';
import { N4_D } from './n4-d.ts';
import { N4_E } from './n4-e.ts';
import { N5_A } from './n5-a.ts';
import { N5_B } from './n5-b.ts';
import { N5_C } from './n5-c.ts';
import { N5_FIRST } from './n5-first.ts';
import type { Unit, UnitLevel } from './types.ts';

/** All units, sorted by `order`. */
export const UNITS: readonly Unit[] = [
  ...N5_FIRST,
  ...N5_A,
  ...N5_B,
  ...N5_C,
  ...N4_A,
  ...N4_B,
  ...N4_C,
  ...N4_D,
  ...N4_E,
  ...N3_A,
  ...N3_B,
  ...N3_C,
  ...N3_D,
  ...N3_E,
].sort((a, b) => a.order - b.order);

/** The unit with this id, if any. */
export function unitById(id: string): Unit | undefined {
  return UNITS.find((unit) => unit.id === id);
}

/** The units of one JLPT level, in path order. */
export function unitsAtLevel(level: UnitLevel): Unit[] {
  return UNITS.filter((unit) => unit.level === level);
}

/** The catalogue entries of a unit's grammar ids, in the unit's order (pattern, meaning, …). */
export function unitGrammar(unit: Unit): GrammarEntry[] {
  return unit.grammar.flatMap((id) => GRAMMAR_CATALOGUE.find((entry) => entry.id === id) ?? []);
}
