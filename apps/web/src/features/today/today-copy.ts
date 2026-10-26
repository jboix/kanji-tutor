/** Plain copy for the Today screen (R1): counts, never praise or pressure. */
import type { ErrorType } from '../../domain/types.ts';
import type { Translate } from '../../ui/i18n/types.ts';

/** The greeting at the top of Home, in Japanese like the date: by the hour of the day. */
export function greeting(now: number): string {
  const hour = new Date(now).getHours();
  if (hour >= 5 && hour < 11) return 'おはようございます';
  if (hour >= 11 && hour < 18) return 'こんにちは';
  return 'こんばんは';
}

/** "10月17日（土）": the date on Today is always in Japanese, whatever the interface language. */
export function dateLine(now: number): string {
  const parts = new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric' }).format(now);
  const day = new Intl.DateTimeFormat('ja-JP', { weekday: 'short' }).format(now);
  return `${parts}（${day}）`;
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
