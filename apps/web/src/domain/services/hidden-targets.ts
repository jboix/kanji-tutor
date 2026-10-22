/**
 * The targets of a card still to be answered and every reading to keep from the learner (L3,
 * D57): the span's accepted readings and the word's dictionary readings.
 */
import type { Repos } from '../repos.ts';
import type { SessionCard } from '../session-types.ts';
import { answerSpan } from './reading-check.ts';

/** A target not answered yet: the text it is written with and the readings to hide. */
export interface HiddenTargetReadings {
  surface: string;
  readings: string[];
}

/** The span text of a target, e.g. 待って for the 待っ token and its ending. */
function targetSurface(card: SessionCard, tokenIndex: number): string {
  return answerSpan(card.sentence, tokenIndex)
    .map((i) => card.sentence.tokens[i]?.surface ?? '')
    .join('');
}

/** The targets from `from` on, with their accepted readings only: known at once, no lookup. */
export function hiddenNow(card: SessionCard, from: number): HiddenTargetReadings[] {
  return card.targets.slice(Math.max(0, from)).map((target) => ({
    surface: targetSurface(card, target.tokenIndex),
    readings: [...new Set(target.readings)],
  }));
}

/** The targets from `from` on, with their accepted and dictionary readings. */
export async function hiddenTargets(
  repos: Repos,
  card: SessionCard,
  from: number,
): Promise<HiddenTargetReadings[]> {
  const targets = card.targets.slice(Math.max(0, from));
  const words = await repos.dictionary.words(targets.map((t) => t.wordId));
  return hiddenNow(card, from).map((hidden, i) => ({
    surface: hidden.surface,
    readings: [...new Set([...hidden.readings, ...(words[i]?.readings ?? [])])],
  }));
}
