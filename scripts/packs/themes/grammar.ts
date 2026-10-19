/**
 * Grammar rules for the thematic units (T2): every unit grammar id is in the catalogue, at or below
 * the unit's level, and its detector finds it in at least one passage sentence of the unit.
 */
import { GRAMMAR_CATALOGUE } from '../../../src/domain/grammar/catalogue.ts';
import { detectEntry } from '../../../src/domain/grammar/detect.ts';
import type { GrammarEntry } from '../../../src/domain/grammar/types.ts';
import type { Unit } from '../../../src/domain/themes/types.ts';
import type { Token } from '../../../src/domain/types.ts';
import type { Violation } from './rules.ts';

function entryProblem(unit: Unit, entry: GrammarEntry, sentences: Token[][]): string | undefined {
  if (entry.level < unit.level) return `${entry.id} is N${entry.level}, above N${unit.level}`;
  if (sentences.some((tokens) => detectEntry(entry, tokens))) return undefined;
  return `${entry.id} (${entry.pattern}) is not found in the passage`;
}

/** Grammar violations of `units`; `tokens` turns a sentence into pack tokens. */
export function checkGrammar(
  units: readonly Unit[],
  tokens: (text: string) => Token[],
  catalogue: readonly GrammarEntry[] = GRAMMAR_CATALOGUE,
): Violation[] {
  const byId = new Map(catalogue.map((entry) => [entry.id, entry]));
  const out: Violation[] = [];
  for (const unit of units) {
    const sentences = unit.passage.sentences.map((s) => tokens(s.ja));
    for (const [i, id] of unit.grammar.entries()) {
      const entry = byId.get(id);
      const message = entry
        ? entryProblem(unit, entry, sentences)
        : `${id} is not in the catalogue`;
      if (message) out.push({ unit: unit.id, where: `grammar[${i}]`, message });
    }
  }
  return out;
}
