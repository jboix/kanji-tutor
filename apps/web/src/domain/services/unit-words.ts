/**
 * A unit's words as the unit writes them (D73): わたし, not 私, in the first N5 units, which keep
 * to their level's kanji. The packs resolve each word to its JMdict entry, whose first form may
 * be a kanji the unit leaves in kana. Pure.
 */
import { hasKanji } from '../kana.ts';
import type { UnitWord } from '../themes/types.ts';
import type { Word } from '../types.ts';

/** The entry with the unit's spelling first; a word the unit writes in kana has no forms. */
export function asUnitWrites(word: Word, words: readonly UnitWord[]): Word {
  const own = words.find(
    (w) =>
      word.forms.includes(w.written) || (!hasKanji(w.written) && word.readings.includes(w.reading)),
  );
  if (!own) return word;
  if (hasKanji(own.written)) {
    return { ...word, forms: [own.written, ...word.forms.filter((f) => f !== own.written)] };
  }
  const readings = [own.written, ...word.readings.filter((r) => r !== own.written)];
  return { ...word, forms: [], readings };
}

/** The entry with `written` first when it is one of its forms (a session's target as shown). */
export function writtenAs(word: Word, written: string): Word {
  if (!word.forms.includes(written)) return word;
  return { ...word, forms: [written, ...word.forms.filter((f) => f !== written)] };
}
