const KANJI = /[㐀-鿿豈-﫿々]/u;

/** A token split so furigana sits over the kanji only, e.g. 待って → 待 (ま) + って. */
export interface FuriganaParts {
  before: string;
  base: string;
  reading: string;
  after: string;
}

/** True when the text holds at least one kanji (or 々), i.e. furigana makes sense. */
export function hasKanji(text: string): boolean {
  return KANJI.test(text);
}

function commonPrefix(a: string, b: string): number {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
}

function commonSuffix(a: string, b: string, limit: number): number {
  let n = 0;
  while (n < limit && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
}

/**
 * Strips the kana the surface and reading share at either end (okurigana), so the reading
 * covers only the kanji part. Returns null when the surface has no kanji.
 */
export function splitFurigana(surface: string, reading: string): FuriganaParts | null {
  if (!hasKanji(surface) || reading === '') return null;
  const pre = commonPrefix(surface, reading);
  const limit = Math.min(surface.length, reading.length) - pre - 1;
  const post = Math.max(0, commonSuffix(surface, reading, Math.max(0, limit)));
  return {
    before: surface.slice(0, pre),
    base: surface.slice(pre, surface.length - post),
    reading: reading.slice(pre, reading.length - post),
    after: surface.slice(surface.length - post),
  };
}
