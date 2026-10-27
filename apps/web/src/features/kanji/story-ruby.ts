/**
 * Furigana for the tutor's short story: each word whose reading the dictionary confirmed gets its
 * reading over its kanji (okurigana left bare); the longest confirmed word wins where two start
 * at the same place. Unconfirmed readings never become furigana: they are listed and marked.
 */
import type { CheckedReading } from '../../ai/types.ts';
import { type FuriganaParts, splitFurigana } from '../../ui/furigana.ts';

export type StoryPiece = { text: string } | FuriganaParts;

/** The confirmed reading of the longest word that starts at `at`, if any. */
function wordAt(text: string, at: number, readings: readonly CheckedReading[]) {
  let best: CheckedReading | undefined;
  for (const reading of readings) {
    const fits = text.startsWith(reading.surface, at);
    if (fits && reading.surface.length > (best?.surface.length ?? 0)) best = reading;
  }
  return best;
}

/** The furigana of the confirmed word at `at`, with its length, if one starts there. */
function furiganaAt(text: string, at: number, readings: readonly CheckedReading[]) {
  const word = wordAt(text, at, readings);
  const parts = word ? splitFurigana(word.surface, word.reading) : null;
  return word && parts ? { parts, length: word.surface.length } : undefined;
}

/** Adds one character to the story, joining it to the plain run before it. */
function addPlain(pieces: StoryPiece[], char: string) {
  const last = pieces.at(-1);
  if (last && !('base' in last)) last.text += char;
  else pieces.push({ text: char });
}

/** The story as plain runs and words with furigana, in order. */
export function storyPieces(text: string, readings: readonly CheckedReading[]): StoryPiece[] {
  const confirmed = readings.filter((reading) => reading.verified && reading.surface !== '');
  const pieces: StoryPiece[] = [];
  let at = 0;
  while (at < text.length) {
    const found = furiganaAt(text, at, confirmed);
    if (found) pieces.push(found.parts);
    else addPlain(pieces, text[at] ?? '');
    at += found?.length ?? 1;
  }
  return pieces;
}
