/** Plain copy for the Today screen (R1): counts, never praise or pressure. */
import type { ErrorType } from '../../domain/types.ts';
import type { Translate } from '../../ui/i18n/types.ts';

const SPELLED = [
  'today.spelled0',
  'today.spelled1',
  'today.spelled2',
  'today.spelled3',
  'today.spelled4',
  'today.spelled5',
  'today.spelled6',
  'today.spelled7',
  'today.spelled8',
  'today.spelled9',
  'today.spelled10',
] as const;

/** "Nine" for 9, "12" for 12: small counts are spelled out at the start of a sentence. */
export function countWord(t: Translate, n: number): string {
  const key = SPELLED[n];
  return key ? t(key) : String(n);
}

/** "10月17日（土）": the date on Today is always in Japanese, whatever the interface language. */
export function dateLine(now: number): string {
  const parts = new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(now);
  const day = new Intl.DateTimeFormat('ja-JP', { weekday: 'short' }).format(now);
  return `${parts}（${day}）`;
}

/** The second sentence of the lead: how many sentences carry new readings. */
export function newReadingsLine(t: Translate, cards: number, fresh: number): string {
  if (fresh === 0) return t('today.readingsNone');
  if (cards === 1) return t('today.readingsIt');
  if (fresh === cards) return t('today.readingsAll');
  return t('today.readingsSome', { n: fresh, count: countWord(t, fresh) });
}

const MANY = {
  'long-vowel': 'today.manyLongVowel',
  sokuon: 'today.manySokuon',
  rendaku: 'today.manyRendaku',
  'wrong-kanji': 'today.manyWrongKanji',
  'kana-variant': 'today.manyKanaVariant',
  other: 'today.manyOther',
} as const satisfies Record<ErrorType, string>;

const ONE = {
  'long-vowel': 'today.oneLongVowel',
  sokuon: 'today.oneSokuon',
  rendaku: 'today.oneRendaku',
  'wrong-kanji': 'today.oneWrongKanji',
  'kana-variant': 'today.oneKanaVariant',
  other: 'today.oneOther',
} as const satisfies Record<ErrorType, string>;

/** "Most misses were long vowels, like" (the example follows). */
export function missLead(t: Translate, errorType: ErrorType, count: number): string {
  return count === 1
    ? t('today.lastMissOne', { what: t(ONE[errorType]) })
    : t('today.lastMissMany', { what: t(MANY[errorType]) });
}

/** "today", "yesterday", "3 days ago". */
export function whenLine(t: Translate, daysAgo: number): string {
  if (daysAgo === 0) return t('today.whenToday');
  return daysAgo === 1 ? t('today.whenYesterday') : t('today.whenAgo', { n: daysAgo });
}
