/**
 * The no-spoil filter over a whole task output (L3). A screen that shows tutor output while
 * targets of the card are still to be answered (the word sheet, its breakdown, a free question,
 * follow-ups, a mistake note) passes every output through `redactOutput`, cached ones included:
 *
 * - every string goes through `redactReadings`, except text the sentence itself shows (a chunk,
 *   a surface), which gives nothing away;
 * - a listed reading (`readings`) or a glossed word's furigana (`words`) that would spoil a
 *   hidden target is dropped (L2: also words sharing a hidden kanji);
 * - a single `reading` claim that is a hidden reading is blanked.
 *
 * The immersion `texts` and `places` stay as they are: a redacted text no longer matches its
 * `texts` entry, so its furigana are not placed at stale offsets.
 */
import { HIDDEN_MARK, type HiddenReading, redactReadings, spoilsReading } from './no-spoil.ts';

/** What the filter needs: the hidden targets and the sentence text, which is never redacted. */
export interface NoSpoil {
  hidden: readonly HiddenReading[];
  sentence: string;
}

type Claim = { surface: string; reading: string };

const KEEP_KEYS = new Set(['texts', 'places']);
const PUNCTUATION = /^[\s、。,.!?！？「」『』]+|[\s、。,.!?！？「」『』]+$/gu;

function isClaim(value: unknown): value is Claim {
  if (value === null || typeof value !== 'object') return false;
  const { surface, reading } = value as Partial<Claim>;
  return typeof surface === 'string' && typeof reading === 'string';
}

function redactString(text: string, filter: NoSpoil): string {
  const bare = text.replace(PUNCTUATION, '');
  if (bare !== '' && filter.sentence.includes(bare)) return text;
  return redactReadings(text, filter.hidden, filter.sentence).text;
}

/** True when a reading is one of the hidden ones, whatever word it is given for. */
export function isHiddenReading(reading: string, hidden: readonly HiddenReading[]): boolean {
  return reading !== '' && spoilsReading({ surface: '', reading }, hidden);
}

function redactList(key: string, list: readonly unknown[], filter: NoSpoil): unknown[] {
  if (key === 'readings') {
    return list.filter((item) => !(isClaim(item) && spoilsReading(item, filter.hidden)));
  }
  if (key === 'words') {
    return list.map((item) => {
      if (!isClaim(item) || !spoilsReading(item, filter.hidden)) return walk(item, filter);
      const { reading: _hidden, ...rest } = item;
      return { ...rest, verified: false };
    });
  }
  return list.map((item) => walk(item, filter));
}

function redactEntry(key: string, value: unknown, filter: NoSpoil): unknown {
  if (KEEP_KEYS.has(key)) return value;
  if (Array.isArray(value)) return redactList(key, value, filter);
  if (key === 'reading' && isClaim(value) && isHiddenReading(value.reading, filter.hidden)) {
    return { ...value, reading: HIDDEN_MARK, verified: false };
  }
  return walk(value, filter);
}

function walk(value: unknown, filter: NoSpoil): unknown {
  if (typeof value === 'string') return redactString(value, filter);
  if (Array.isArray(value)) return value.map((item) => walk(item, filter));
  if (value === null || typeof value !== 'object') return value;
  const entries = Object.entries(value).map(([key, inner]) => [
    key,
    redactEntry(key, inner, filter),
  ]);
  return Object.fromEntries(entries);
}

/** `value` with nothing that gives a hidden target's reading away (see the module comment). */
export function redactOutput<T>(value: T, filter: NoSpoil): T {
  if (filter.hidden.length === 0) return value;
  return walk(value, filter) as T;
}
