/**
 * Episodes: one short chat per unit in which the cast lives the unit's theme, written for this
 * app at the unit's level with its words and grammar. Committed data, not runtime AI output. The
 * Japanese carries no hand-written readings: the app tokenizes it for furigana and word taps.
 * Pure data types.
 */
import type { CastId } from '../cast.ts';
import type { DialogueText } from '../dialogues/types.ts';

/** One chat message. */
export interface EpisodeLine {
  by: CastId;
  ja: string;
  /** The line's translation. */
  tr: DialogueText;
}

export interface Episode {
  /** The unit it belongs to (`Unit.id`). */
  unitId: string;
  /** A short title in each language, e.g. "Yuki is late, again". */
  title: DialogueText;
  /** Two or three of the cast; the first is who the learner reads along with. */
  cast: readonly CastId[];
  /** 6 to 10 lines. */
  lines: readonly EpisodeLine[];
}
