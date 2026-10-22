/**
 * Theme check (T2, T6): static rules plus the vocabulary check against the committed word pack.
 * `bun scripts/packs/themes/check.ts` prints every violation and exits 1 when there is any.
 */
import { resolve } from 'node:path';
import { UNITS } from '../../../src/domain/themes/index.ts';
import type { Unit } from '../../../src/domain/themes/types.ts';
import type { Kanji } from '../../../src/domain/types.ts';
import { packTokens } from '../grammar/tokenize.ts';
import { buildTokenizer } from '../tokenizer.ts';
import { checkGrammar } from './grammar.ts';
import { checkKanjiLevels } from './kanji-levels.ts';
import {
  loadPackSentences,
  loadPackWords,
  loadStore,
  packLookup,
  resolutionTable,
} from './pack-words.ts';
import { checkShape, formatViolation, type Violation } from './rules.ts';
import { checkVocabulary } from './vocabulary.ts';

const ROOT = resolve(import.meta.dirname, '..', '..', '..');

/** Every violation of `units`, using the pack at `manifestPath` and kuromoji from `root`. */
export async function checkThemes(
  units: readonly Unit[],
  manifestPath = resolve(ROOT, 'public', 'packs', 'manifest.json'),
  root = ROOT,
): Promise<Violation[]> {
  const words = loadPackWords(manifestPath);
  const ctx = {
    tokenize: await buildTokenizer(root),
    lookup: packLookup(words),
    words: new Map(words.map((w) => [w.id, w])),
    preferred: resolutionTable(loadPackSentences(manifestPath)),
  };
  const grammar = checkGrammar(units, (text) => packTokens(ctx.tokenize, text));
  const kanji = new Map(loadStore<Kanji>(manifestPath, 'kanji').map((k) => [k.char, k]));
  return [
    ...checkShape(units),
    ...checkVocabulary(units, ctx),
    ...grammar,
    ...checkKanjiLevels(units, kanji),
  ];
}

if (import.meta.main) {
  const violations = await checkThemes(UNITS);
  for (const v of violations) console.log(formatViolation(v));
  console.log(`${UNITS.length} units, ${violations.length} violations`);
  process.exit(violations.length > 0 ? 1 : 0);
}
