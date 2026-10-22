/**
 * The link state of a new round on the Read screen: "Take another session" (D108) stamps it, and
 * a retry round (D117) carries only the missed cards with it.
 */
import type { SessionCard } from '../../domain/session-types.ts';

/** The link state of another round: a new stamp, so the same link builds a new session. */
export interface AgainState {
  round: number;
}

/** The round stamp in a location's state, or 0 for the first round. */
export function roundOf(state: unknown): number {
  if (typeof state !== 'object' || state === null || !('round' in state)) return 0;
  return typeof state.round === 'number' ? state.round : 0;
}

/** The link state of a retry round (D117): another round stamp, and only the missed cards. */
export interface RetryState extends AgainState {
  retry: SessionCard[];
}

/** The retry round's cards in a location's state, or undefined for any other round. */
export function retryOf(state: unknown): SessionCard[] | undefined {
  if (typeof state !== 'object' || state === null || !('retry' in state)) return undefined;
  const cards = state.retry;
  return Array.isArray(cards) && cards.length > 0 ? (cards as SessionCard[]) : undefined;
}
