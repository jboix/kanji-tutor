/**
 * Catalogue lint (G1): unique ids and patterns, kebab-case ids, levels 5/4/3, no empty field,
 * and every family shared by at least two entries so questions have distractors.
 * Run with `bun scripts/packs/grammar/lint.ts`; the tests run it too.
 */
import { GRAMMAR_CATALOGUE } from '../../../src/domain/grammar/catalogue.ts';
import { FUNCTION_WORDS } from '../../../src/domain/grammar/function-words.ts';
import type { FunctionWord, GrammarEntry } from '../../../src/domain/grammar/types.ts';

const TEXT_FIELDS = ['id', 'pattern', 'family', 'meaning', 'formation', 'explanation'] as const;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const twice = new Set<string>();
  for (const value of values) (seen.has(value) ? twice : seen).add(value);
  return [...twice];
}

function entryProblems(entry: GrammarEntry): string[] {
  const problems: string[] = [];
  for (const field of TEXT_FIELDS) {
    if (entry[field].trim() === '') problems.push(`${entry.id}: empty ${field}`);
  }
  if (!KEBAB.test(entry.id)) problems.push(`${entry.id}: id is not kebab-case`);
  if (![5, 4, 3].includes(entry.level)) problems.push(`${entry.id}: level ${entry.level}`);
  if (entry.cloze.length === 0 || entry.cloze.some((text) => text.trim() === '')) {
    problems.push(`${entry.id}: empty cloze`);
  }
  return problems;
}

function familyProblems(catalogue: readonly GrammarEntry[]): string[] {
  const counts = new Map<string, number>();
  for (const entry of catalogue) counts.set(entry.family, (counts.get(entry.family) ?? 0) + 1);
  return [...counts]
    .filter(([, count]) => count < 2)
    .map(([family]) => `family ${family} has a single entry`);
}

/** Every problem found in the catalogue; empty when it is clean. */
export function lintCatalogue(catalogue: readonly GrammarEntry[] = GRAMMAR_CATALOGUE): string[] {
  return [
    ...duplicates(catalogue.map((e) => e.id)).map((id) => `duplicate id ${id}`),
    ...duplicates(catalogue.map((e) => e.pattern)).map((p) => `duplicate pattern ${p}`),
    ...catalogue.flatMap(entryProblems),
    ...familyProblems(catalogue),
  ];
}

const WORD_FIELDS = ['id', 'pattern', 'meaning', 'explanation'] as const;

function wordProblems(word: FunctionWord, ids: ReadonlySet<string>): string[] {
  const problems = WORD_FIELDS.filter((field) => word[field].trim() === '').map(
    (field) => `${word.id}: empty ${field}`,
  );
  if (!/^particle-[a-z]+(-[a-z]+)*$/.test(word.id)) problems.push(`${word.id}: bad id`);
  if (![5, 4].includes(word.level)) problems.push(`${word.id}: level ${word.level}`);
  if (word.uses.length < 2 || word.uses.length > 4)
    problems.push(`${word.id}: ${word.uses.length} uses`);
  const blank = word.uses.some((u) => !u.use.trim() || !u.example.trim() || !u.translation.trim());
  if (blank) problems.push(`${word.id}: empty use`);
  if (word.grammarId && !ids.has(word.grammarId)) {
    problems.push(`${word.id}: unknown grammar ${word.grammarId}`);
  }
  return problems;
}

/**
 * Particle and function-word lint (G5): unique ids and patterns, none shared with the catalogue,
 * N5 or N4, two to four complete uses, and a linked catalogue point that exists.
 */
export function lintFunctionWords(
  words: readonly FunctionWord[] = FUNCTION_WORDS,
  catalogue: readonly GrammarEntry[] = GRAMMAR_CATALOGUE,
): string[] {
  const ids = new Set(catalogue.map((e) => e.id));
  return [
    ...duplicates([...catalogue, ...words].map((e) => e.id)).map((id) => `duplicate id ${id}`),
    ...duplicates(words.map((w) => w.pattern)).map((p) => `duplicate pattern ${p}`),
    ...words.flatMap((word) => wordProblems(word, ids)),
  ];
}

/** Entry counts per JLPT level. */
export function levelCounts(catalogue: readonly GrammarEntry[] = GRAMMAR_CATALOGUE) {
  const counts = { 5: 0, 4: 0, 3: 0 };
  for (const entry of catalogue) counts[entry.level]++;
  return counts;
}

if (import.meta.main) {
  const problems = [...lintCatalogue(), ...lintFunctionWords()];
  for (const problem of problems) console.error(problem);
  const counts = levelCounts();
  console.log(`grammar catalogue: N5 ${counts[5]}, N4 ${counts[4]}, N3 ${counts[3]}`);
  if (problems.length > 0) process.exit(1);
}
