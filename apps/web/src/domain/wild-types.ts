/** In the wild's saved photos: each photo the tutor read, kept with what it read. */

/** What the tutor read, as the domain needs it (the AI layer's `SignReading`). */
export interface SignInput {
  place: string;
  kanji: readonly { char: string; box: readonly [number, number, number, number] }[];
  words: readonly { surface: string; reading: string; meaning: string }[];
  readings: readonly { surface: string; reading: string; verified: boolean }[];
}

/** The reading kept with a photo: also its lines, for the tutor. */
export interface WildReading extends SignInput {
  lines: readonly string[];
}

/** A photo the tutor read, on this device only: opening it again asks nothing. */
export interface WildPhoto {
  id: string;
  createdAt: number;
  photo: Blob;
  reading: WildReading;
}
