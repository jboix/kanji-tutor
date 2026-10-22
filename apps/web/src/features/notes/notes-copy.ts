/** Plain copy for the weekly notes (A7): counts and real examples, never praise. */
import { rankedErrorTypes, type WeekStats } from '../../domain/services/index.ts';
import type { ErrorType } from '../../domain/types.ts';
import type { Formats } from '../../ui/i18n/format.ts';
import type { PlainKey, Translate } from '../../ui/i18n/types.ts';

const DAY_MONTH = { day: 'numeric', month: 'long' } as const;

/** "12–18 October", or "28 September – 4 October" across months. `end` is exclusive. */
export function rangeLine(format: Formats, start: number, end: number): string {
  const first = new Date(start);
  const last = new Date(end - 1);
  if (first.getMonth() === last.getMonth()) {
    return `${format.number(first.getDate())}–${format.date(last, DAY_MONTH)}`;
  }
  return `${format.date(first, DAY_MONTH)} – ${format.date(last, DAY_MONTH)}`;
}

const MANY: Record<ErrorType, PlainKey> = {
  'long-vowel': 'notes.manyLongVowel',
  sokuon: 'notes.manySokuon',
  rendaku: 'notes.manyRendaku',
  'wrong-kanji': 'notes.manyWrongKanji',
  'kana-variant': 'notes.manyKanaVariant',
  other: 'notes.manyOther',
};

function readLine(t: Translate, stats: WeekStats): string {
  if (stats.sentencesRead === 0) return t('notes.nothingRead');
  const right = stats.correct === 0 ? t('notes.rightNone') : String(stats.correct);
  return t('notes.read', { n: stats.sentencesRead, right });
}

function missLead(t: Translate, stats: WeekStats, top: ErrorType): string {
  const n = Object.values(stats.byErrorType).reduce((a, b) => a + b, 0);
  const count = stats.byErrorType[top] ?? 0;
  const what = t(MANY[top]);
  if (count !== n) return t('notes.missSome', { count, n, what });
  return n === 1 ? t('notes.missOne', { what }) : t('notes.missAll', { n, what });
}

function missLine(t: Translate, stats: WeekStats): string | undefined {
  const [top] = rankedErrorTypes(stats.byErrorType);
  if (top === undefined) return undefined;
  const lead = missLead(t, stats, top);
  const examples = stats.missExamples
    .slice(0, 2)
    .map((e) => t('notes.missedAs', { surface: e.surface, given: e.given }))
    .join(', ');
  return examples === '' ? lead : t('notes.missed', { lead, examples });
}

function grammarLine(t: Translate, stats: WeekStats): string | undefined {
  const [first, second] = stats.unusedGrammar;
  if (first === undefined) return undefined;
  return second === undefined
    ? t('notes.unusedOne', { first })
    : t('notes.unusedTwo', { first, second });
}

/** The letter without AI: the same real stats, said plainly. */
export function plainLetter(t: Translate, stats: WeekStats): string[] {
  return [readLine(t, stats), missLine(t, stats), grammarLine(t, stats)].filter(
    (line): line is string => line !== undefined,
  );
}

/** "Kept 17 October". */
export function keptOn(t: Translate, format: Formats, at: number): string {
  return t('notes.keptOn', { date: format.date(at, DAY_MONTH) });
}
