/**
 * JLPT level corrections for clearly basic words. Waller's lists, as mapped to JMdict ids,
 * leave some everyday words untagged or put them far too high (顔 untagged, すぐ as N1), and a
 * sentence level counts an untagged word as N1, so these would wrongly gate sentences.
 *
 * Each entry names the JMdict entry by its usual writing and reading. Only words that every
 * beginner course teaches in its first months belong here, at the level of the usual lists.
 */
import { toHiragana } from 'wanakana';
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { JmWord } from './jmdict.ts';

export interface JlptOverride {
  written: string;
  reading: string;
  level: JlptLevel;
}

export const JLPT_OVERRIDES: readonly JlptOverride[] = [
  { written: '顔', reading: 'かお', level: 5 },
  // The lists put these day-one words at N3 (日本語 and 昼ごはん are N5).
  { written: '日本', reading: 'にほん', level: 5 },
  { written: 'お昼', reading: 'おひる', level: 5 },
  { written: 'すぐ', reading: 'すぐ', level: 5 },
  { written: 'ジュース', reading: 'ジュース', level: 5 },
  { written: '野球', reading: 'やきゅう', level: 4 },
  { written: '間違う', reading: 'まちがう', level: 4 },
];

function matches(word: JmWord, override: JlptOverride): boolean {
  const reading = toHiragana(override.reading);
  const written = [...word.kanji, ...word.kana].some((t) => t.text === override.written);
  return written && word.kana.some((k) => toHiragana(k.text) === reading);
}

/**
 * Applies the overrides to `levels` (JMdict id → level). Each override takes the common entry
 * with that writing and reading, lowest id first. Returns the overrides that matched no entry.
 */
export function applyOverrides(
  words: readonly JmWord[],
  levels: Map<string, JlptLevel | undefined>,
  overrides: readonly JlptOverride[] = JLPT_OVERRIDES,
): JlptOverride[] {
  const missing: JlptOverride[] = [];
  for (const override of overrides) {
    const hits = words.filter((w) => matches(w, override));
    const best = hits.find((w) => w.kanji.some((k) => k.common) || w.kana.some((k) => k.common));
    const entry = best ?? hits[0];
    if (entry) levels.set(entry.id, override.level);
    else missing.push(override);
  }
  return missing;
}

function entryWritten(words: readonly JmWord[], written: string, reading?: string) {
  return words.find(
    (w) =>
      w.kanji.some((k) => k.text === written) &&
      (!reading || w.kana.some((k) => toHiragana(k.text) === reading)),
  );
}

/**
 * Fused polite forms (お寺, お正月) are on no list; they take the level of the word without the
 * prefix (寺, 正月), so the units can use them at that level.
 */
export function inheritPolitePrefix(
  words: readonly JmWord[],
  levels: Map<string, JlptLevel | undefined>,
  writings: readonly string[],
): void {
  for (const written of writings.filter((w) => /^[おご]/u.test(w))) {
    const fused = entryWritten(words, written);
    if (!fused || levels.has(fused.id)) continue;
    const reading = toHiragana(fused.kana[0]?.text ?? '').slice(1);
    const base = entryWritten(words, written.slice(1), reading);
    const level = base ? levels.get(base.id) : undefined;
    if (level) levels.set(fused.id, level);
  }
}
