/** Static rules for the thematic units (T1, T2, T6): shape, bounds, indices, ids and order. */
import type { Unit } from '../../../src/domain/themes/types.ts';

export interface Violation {
  /** Unit id, or "*" for path-wide rules. */
  unit: string;
  /** Where in the unit, e.g. "passage[2]", "questions[1].options[3]", "words[4]". */
  where: string;
  message: string;
}

export const BOUNDS = {
  words: [8, 15],
  grammar: [2, 4],
  sentences: [3, 8],
  questions: [2, 4],
} as const;

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HIRAGANA_OR_KATAKANA = /^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u;

function within(unit: Unit, key: keyof typeof BOUNDS, count: number): Violation[] {
  const [min, max] = BOUNDS[key];
  if (count >= min && count <= max) return [];
  return [{ unit: unit.id, where: key, message: `${count} ${key}, expected ${min}–${max}` }];
}

function sizes(unit: Unit): Violation[] {
  return [
    ...within(unit, 'words', unit.words.length),
    ...within(unit, 'grammar', unit.grammar.length),
    ...within(unit, 'sentences', unit.passage.sentences.length),
    ...within(unit, 'questions', unit.questions.length),
  ];
}

function duplicates(values: readonly string[]): string[] {
  return [...new Set(values.filter((value, i) => values.indexOf(value) !== i))];
}

function wordRules(unit: Unit): Violation[] {
  const out: Violation[] = [];
  for (const [i, word] of unit.words.entries()) {
    if (!HIRAGANA_OR_KATAKANA.test(word.reading)) {
      out.push({
        unit: unit.id,
        where: `words[${i}]`,
        message: `reading "${word.reading}" is not kana`,
      });
    }
  }
  for (const dup of duplicates(unit.words.map((w) => w.written))) {
    out.push({ unit: unit.id, where: 'words', message: `duplicate word ${dup}` });
  }
  for (const dup of duplicates(unit.grammar)) {
    out.push({ unit: unit.id, where: 'grammar', message: `duplicate grammar ${dup}` });
  }
  return out;
}

function questionRules(unit: Unit): Violation[] {
  const out: Violation[] = [];
  const sentences = unit.passage.sentences.length;
  for (const [i, q] of unit.questions.entries()) {
    const where = `questions[${i}]`;
    const fail = (message: string) => out.push({ unit: unit.id, where, message });
    if (q.options.length !== 4) fail(`${q.options.length} options, expected 4`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length) {
      fail(`answer ${q.answer} is not an option index`);
    }
    if (!Number.isInteger(q.evidence) || q.evidence < 0 || q.evidence >= sentences) {
      fail(`evidence ${q.evidence} is not a passage sentence index`);
    }
    if (duplicates(q.options).length > 0) fail('duplicate options');
    if (q.explanation.trim().length === 0) fail('empty explanation');
  }
  return out;
}

function textRules(unit: Unit): Violation[] {
  const out: Violation[] = [];
  for (const [i, s] of unit.passage.sentences.entries()) {
    if (s.ja.trim().length === 0 || s.en.trim().length === 0) {
      out.push({ unit: unit.id, where: `passage[${i}]`, message: 'empty sentence or translation' });
    }
  }
  if (!SLUG.test(unit.id)) out.push({ unit: unit.id, where: 'id', message: 'id is not a slug' });
  return out;
}

function pathRules(units: readonly Unit[]): Violation[] {
  const out: Violation[] = [];
  for (const dup of duplicates(units.map((u) => u.id))) {
    out.push({ unit: dup, where: 'id', message: 'duplicate unit id' });
  }
  const orders = units.map((u) => u.order).sort((a, b) => a - b);
  if (orders.some((order, i) => order !== i + 1)) {
    out.push({ unit: '*', where: 'order', message: `orders are not 1..${units.length}` });
  }
  const sorted = [...units].sort((a, b) => a.order - b.order);
  for (const [i, unit] of sorted.entries()) {
    const previous = sorted[i - 1];
    if (previous && previous.level < unit.level) {
      out.push({
        unit: unit.id,
        where: 'level',
        message: `N${unit.level} after N${previous.level}`,
      });
    }
  }
  return out;
}

/** Every static rule over the whole path. An empty list means the units are well formed. */
export function checkShape(units: readonly Unit[]): Violation[] {
  return [
    ...pathRules(units),
    ...units.flatMap((unit) => [
      ...sizes(unit),
      ...wordRules(unit),
      ...questionRules(unit),
      ...textRules(unit),
    ]),
  ];
}

export function formatViolation(v: Violation): string {
  return `${v.unit} · ${v.where}: ${v.message}`;
}
