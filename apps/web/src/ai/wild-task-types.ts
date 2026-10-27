/** In the wild: a photo of Japanese out in the world, read by the tutor. */
import type { CheckedReading, Media } from './task-shared-types.ts';

export interface ReadSignInput {
  image: Media;
}

/** Where a kanji stands on the photo: [top, left, bottom, right], each 0–1000 of the image. */
export type SignBox = readonly [number, number, number, number];

export interface SignKanji {
  char: string;
  box: SignBox;
}

/** A word on the photo written with kanji, with its reading and a short meaning. */
export interface SignWord {
  surface: string;
  reading: string;
  meaning: string;
}

export interface SignReading {
  /** What the photo shows, in a few words: "Station sign", "Ramen menu". */
  place: string;
  /** Every Japanese line, as printed, in reading order. */
  lines: string[];
  /** Every kanji seen, each time it appears, with its box. */
  kanji: SignKanji[];
  words: SignWord[];
  /** The words' readings, checked against the dictionary (A8). */
  readings: CheckedReading[];
}
