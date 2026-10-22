/** Catalogue and function-word lookups for the grammar pages (G4, G5, P3): static, no AI. */
import {
  FUNCTION_WORDS,
  type FunctionWord,
  GRAMMAR_CATALOGUE,
  type GrammarEntry,
} from '../../domain/grammar/index.ts';
import type { Translate } from '../../ui/i18n/types.ts';

/** A page's subject: a catalogue point, or a particle or function word (G5). */
export type Point = GrammarEntry | FunctionWord;

const BY_ID = new Map<string, Point>(
  [...GRAMMAR_CATALOGUE, ...FUNCTION_WORDS].map((e) => [e.id, e]),
);

/** The catalogue point or function word with this id, or undefined. */
export function entryById(id: string): Point | undefined {
  return BY_ID.get(id);
}

/** Particles and function words have uses instead of a formation and a family. */
export function isFunctionWord(point: Point): point is FunctionWord {
  return 'uses' in point;
}

/** The spelling without the sense: "から (from)" → "から". */
function spelling(pattern: string): string {
  return pattern.replace(/\s*[(（].*$/, '');
}

/** Function words written the same (から from / because), then the catalogue point it covers. */
function relatedWords(word: FunctionWord): Point[] {
  const same = FUNCTION_WORDS.filter(
    (w) => w.id !== word.id && spelling(w.pattern) === spelling(word.pattern),
  );
  const point = word.grammarId ? BY_ID.get(word.grammarId) : undefined;
  return point ? [...same, point] : same;
}

/** Points easy to confuse with this one: the same family, easiest level first. */
export function relatedOf(point: Point): Point[] {
  if (isFunctionWord(point)) return relatedWords(point);
  return GRAMMAR_CATALOGUE.filter((e) => e.family === point.family && e.id !== point.id).sort(
    (a, b) => b.level - a.level,
  );
}

/** The heading under the pattern: "Permission", or "Particles and function words". */
export function groupLabel(point: Point, t: Translate): string {
  return isFunctionWord(point) ? t('grammar.functionWords') : familyLabel(point.family, t);
}

/** "giving-receiving" → "Giving and receiving"; families added later get a plain label. */
export function familyLabel(family: string, t: Translate): string {
  const key = `grammarFamily.${family}`;
  const known = t(key as 'grammarFamily.time');
  if (known !== key) return known;
  const words = family.replace(/-/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** One run of a formation: a slot the learner fills (N, V-て) or the fixed grammar (もいい). */
export interface FormationPart {
  text: string;
  slot: boolean;
  /** Position in the formation, a stable key. */
  at: number;
}

const LATIN = /[A-Za-z]/;

/** Splits on " + " outside brackets: "plain form (N + の) + くせに" has two parts. */
function splitPlus(formation: string): string[] {
  const hidden = formation.replace(/[(（][^)）]*[)）]/g, (group) =>
    group.replaceAll(' + ', '\u0000'),
  );
  return hidden.split(' + ').map((part) => part.replaceAll('\u0000', ' + '));
}

/** "V-て + もいい" → [slot "V-て", fixed "もいい"]. A part with Latin letters is a slot. */
export function formationParts(formation: string): FormationPart[] {
  return splitPlus(formation)
    .map((text) => text.trim())
    .filter((text) => text !== '')
    .map((text, at) => ({ text, slot: LATIN.test(text), at }));
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[〜～~]/g, '')
    .replace(/-/g, ' ')
    .trim();
}

/** Points whose pattern, meaning or id contains the query; all of them for an empty query. */
export function searchEntries<T extends Point>(query: string, entries: readonly T[]): T[] {
  const q = normalize(query);
  if (q === '') return [...entries];
  return entries.filter((entry) =>
    [entry.pattern, entry.meaning, entry.id].some((field) => normalize(field).includes(q)),
  );
}

/** Points of one level, grouped by family in catalogue order. */
export interface LevelGroup {
  level: GrammarEntry['level'];
  families: { family: string; entries: GrammarEntry[] }[];
}

/** N5 first, then N4 and N3; families in the order their first point appears. */
export function groupByLevel(entries: readonly GrammarEntry[]): LevelGroup[] {
  const levels = [...new Set(entries.map((e) => e.level))].sort((a, b) => b - a);
  return levels.map((level) => {
    const families = new Map<string, GrammarEntry[]>();
    for (const entry of entries.filter((e) => e.level === level)) {
      families.set(entry.family, [...(families.get(entry.family) ?? []), entry]);
    }
    return { level, families: [...families].map(([family, list]) => ({ family, entries: list })) };
  });
}

/** The pattern without its leading 〜, for a heading or a link label. */
export function bare(pattern: string): string {
  return pattern.replace(/^[〜～]/, '');
}
