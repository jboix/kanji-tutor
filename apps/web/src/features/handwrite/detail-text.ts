/** Copy for the candidate detail strip (handwrite.html), as text and Japanese segments. */
import { readingLabel } from '../../domain/services/index.ts';
import type { Kanji } from '../../domain/types.ts';
import { LOCALES } from '../../ui/i18n/translate.ts';
import type { Translate } from '../../ui/i18n/types.ts';
import type { UiLanguage } from '../../ui/languages.ts';

/** Plain text, or a run of Japanese to set in Klee One. */
export type Segment = string | { ja: string };

export interface CandidateFacts {
  kanji: Kanji;
  /** Your words containing the kanji. */
  wordCount: number;
  /** A component shared with kanji you have met, e.g. 寺 with 持 and 特. */
  shared?: { component: string; with: string[] };
}

const READINGS_EACH = 2;

/** "タイ · ま・つ": up to two on and two kun readings, okurigana after ・ (D12). */
export function readingsLine(kanji: Kanji): Segment[] {
  const on = kanji.on.slice(0, READINGS_EACH).join('、');
  const kun = kanji.kun.slice(0, READINGS_EACH).map(readingLabel).join('、');
  const groups = [on, kun].filter((part) => part !== '');
  // The · between groups is UI punctuation, set in the UI font as in handwrite.html.
  return groups.flatMap((ja, i): Segment[] => (i === 0 ? [{ ja }] : [' · ', { ja }]));
}

/** "持, 特 and 時" in the language's list style, with each kanji as a Japanese run. */
function listed(language: UiLanguage, chars: readonly string[]): Segment[] {
  const list = new Intl.ListFormat(LOCALES[language], { type: 'conjunction' });
  return list
    .formatToParts(chars)
    .map((part): Segment => (part.type === 'element' ? { ja: part.value } : part.value));
}

/** Segments of a message whose `{holes}` take segments, e.g. Japanese runs. */
function fill(text: string, holes: Readonly<Record<string, Segment[]>>): Segment[] {
  return text
    .split(/\{(\w+)\}/)
    .flatMap((part, i): Segment[] => (i % 2 === 1 ? (holes[part] ?? []) : part ? [part] : []));
}

function wordsPart(t: Translate, count: number): string {
  return count === 0 ? t('handwrite.notInWords') : t('handwrite.inWords', { n: count });
}

/** "In 3 of your words. Shares 寺 with 持 and 特, which you've also met." */
export function wordsLine(
  t: Translate,
  language: UiLanguage,
  { wordCount, shared }: CandidateFacts,
): Segment[] {
  const words = wordsPart(t, wordCount);
  if (!shared || shared.with.length === 0) return [words];
  const template = t('handwrite.shares', {
    words: '{words}',
    component: '{component}',
    kanji: '{kanji}',
  });
  return fill(template, {
    words: [words],
    component: [{ ja: shared.component }],
    kanji: listed(language, shared.with),
  });
}

/** The segments as plain text (for tests and accessible names). */
export function segmentText(segments: readonly Segment[]): string {
  return segments.map((s) => (typeof s === 'string' ? s : s.ja)).join('');
}

const JAPANESE = /([\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー々・]+)/u;

/** Splits free text (an AI reason) into plain and Japanese runs. */
export function jaSegments(text: string): Segment[] {
  return text
    .split(JAPANESE)
    .filter((part) => part !== '')
    .map((part) => (JAPANESE.test(part) ? { ja: part } : part));
}
