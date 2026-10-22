/**
 * Offline kanji handwriting recognizer (I4): any stroke order, roughly any stroke count. A clean
 * TypeScript port of KanjiCanvas (MIT, © 2019–2024 Dominik Klein, © 2020 Seth Clydesdale,
 * https://github.com/asdfjkl/kanjicanvas; see LICENSE-kanjicanvas.txt) over its 2,213 reference
 * patterns. Loaded lazily from the handwrite screen, never in the app shell (N4).
 */
import { classify, type Reference } from './classify.ts';
import { extractFeatures, momentNormalize, type Pattern } from './geometry.ts';
import { decodePatterns, type PatternTable } from './patterns.ts';

export type { Pattern, Point, Stroke } from './geometry.ts';

export interface Candidate {
  char: string;
  /** Mean distance per stroke in a 256-unit box; lower is closer. */
  score: number;
}

export interface Recognizer {
  recognize(strokes: Pattern, limit?: number): Candidate[];
}

/** A recognizer over the given references. */
export function createRecognizer(refs: readonly Reference[]): Recognizer {
  return {
    recognize(strokes, limit = 10) {
      const drawn = strokes.filter((stroke) => stroke.length > 0);
      if (drawn.length === 0) return [];
      const input = extractFeatures(momentNormalize(drawn));
      return classify(input, refs, limit).map(({ ref, score }) => ({ char: ref.char, score }));
    },
  };
}

/** Loads the bundled KanjiCanvas patterns (a separate chunk) and builds the recognizer. */
export async function loadRecognizer(): Promise<Recognizer> {
  const table: PatternTable = (await import('./patterns.json')).default;
  return createRecognizer(decodePatterns(table));
}
