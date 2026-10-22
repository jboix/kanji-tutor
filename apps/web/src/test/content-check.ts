/**
 * Completeness and sanity checks for content translations (N9). Returns problems as lines,
 * so a test can show every gap at once.
 */
import type { ById, FunctionWordText, GrammarText, UnitText } from '../domain/content-types.ts';
import type { FunctionWord, GrammarEntry } from '../domain/grammar/types.ts';
import type { Unit } from '../domain/themes/types.ts';

/** Strings that may stay identical to the English: proper nouns and bare patterns. */
const SAME_ALLOWED = new Set<string>(['N + ほど + ではない', 'Kabuki', 'Sumo', 'Karaoke']);

const JA_RUN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々〆〇]+/gu;

/** The distinct Japanese runs of a text, sorted: translations keep every one and add none. */
function japaneseOf(text: string): string {
  return [...new Set([...text.matchAll(JA_RUN)].map((m) => m[0]))].sort().join('|');
}

/** Formations need a translation when they hold English words beyond N, V and A. */
export function formationNeedsText(formation: string): boolean {
  return /[a-z]{2,}/.test(formation);
}

function textProblems(where: string, english: string, text: string | undefined): string[] {
  if (text === undefined) return [`${where}: missing`];
  if (text.trim() === '') return [`${where}: empty`];
  const problems: string[] = [];
  if (text === english && !SAME_ALLOWED.has(text)) problems.push(`${where}: same as English`);
  if (japaneseOf(text) !== japaneseOf(english)) {
    problems.push(`${where}: Japanese differs (${japaneseOf(english)} → ${japaneseOf(text)})`);
  }
  return problems;
}

function extraIds(where: string, ids: readonly string[], texts: ById<unknown>): string[] {
  const known = new Set(ids);
  return Object.keys(texts)
    .filter((id) => !known.has(id))
    .map((id) => `${where} ${id}: not an English id`);
}

function grammarEntryProblems(entry: GrammarEntry, text: GrammarText | undefined): string[] {
  const at = `grammar ${entry.id}`;
  if (!text) return [`${at}: missing`];
  const problems = [
    ...textProblems(`${at}.meaning`, entry.meaning, text.meaning),
    ...textProblems(`${at}.explanation`, entry.explanation, text.explanation),
  ];
  if (formationNeedsText(entry.formation)) {
    problems.push(...textProblems(`${at}.formation`, entry.formation, text.formation));
    const plus = (s: string) => s.split(' + ').length;
    if (text.formation && plus(text.formation) !== plus(entry.formation)) {
      problems.push(`${at}.formation: the " + " parts differ`);
    }
  } else if (text.formation !== undefined) {
    problems.push(`${at}.formation: not needed, the English has no English words`);
  }
  return problems;
}

/** Every gap between the English catalogue and one language's grammar texts. */
export function grammarProblems(
  entries: readonly GrammarEntry[],
  texts: ById<GrammarText>,
): string[] {
  return [
    ...entries.flatMap((entry) => grammarEntryProblems(entry, texts[entry.id])),
    ...extraIds(
      'grammar',
      entries.map((e) => e.id),
      texts,
    ),
  ];
}

function wordProblems(word: FunctionWord, text: FunctionWordText | undefined): string[] {
  const at = `particle ${word.id}`;
  if (!text) return [`${at}: missing`];
  const problems = [
    ...textProblems(`${at}.meaning`, word.meaning, text.meaning),
    ...textProblems(`${at}.explanation`, word.explanation, text.explanation),
  ];
  if (text.uses.length !== word.uses.length) problems.push(`${at}.uses: count differs`);
  word.uses.forEach((use, i) => {
    problems.push(...textProblems(`${at}.uses[${i}].use`, use.use, text.uses[i]?.use));
    problems.push(
      ...textProblems(`${at}.uses[${i}].translation`, use.translation, text.uses[i]?.translation),
    );
  });
  return problems;
}

/** Every gap between the English particles and one language's texts. */
export function functionWordProblems(
  words: readonly FunctionWord[],
  texts: ById<FunctionWordText>,
): string[] {
  return [
    ...words.flatMap((word) => wordProblems(word, texts[word.id])),
    ...extraIds(
      'particle',
      words.map((w) => w.id),
      texts,
    ),
  ];
}

function listProblems(at: string, english: readonly string[], texts: readonly string[]): string[] {
  const problems = texts.length === english.length ? [] : [`${at}: count differs`];
  english.forEach((line, i) => {
    problems.push(...textProblems(`${at}[${i}]`, line, texts[i]));
  });
  return problems;
}

function unitProblems(unit: Unit, text: UnitText | undefined): string[] {
  const at = `unit ${unit.id}`;
  if (!text) return [`${at}: missing`];
  return [
    ...textProblems(`${at}.theme`, unit.theme, text.theme),
    ...textProblems(`${at}.summary`, unit.summary, text.summary),
    ...listProblems(
      `${at}.sentences`,
      unit.passage.sentences.map((s) => s.en),
      text.sentences,
    ),
    ...listProblems(
      `${at}.questions`,
      unit.questions.map((q) => q.explanation),
      text.questions,
    ),
  ];
}

/** Every gap between the English units and one language's texts. */
export function unitTextProblems(units: readonly Unit[], texts: ById<UnitText>): string[] {
  return [
    ...units.flatMap((unit) => unitProblems(unit, texts[unit.id])),
    ...extraIds(
      'unit',
      units.map((u) => u.id),
      texts,
    ),
  ];
}
