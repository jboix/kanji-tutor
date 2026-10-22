/**
 * Today's session handed on to the Read screen (N10): Today builds the session to preview it, and
 * Begin reading starts that same session instead of building it again. Kept in memory only, and
 * taken once.
 */
import type { SessionCard } from '../domain/session-types.ts';

interface Offered {
  /** When Today built it; Begin reading carries this stamp in its link state. */
  builtAt: number;
  cards: SessionCard[];
}

let offered: Offered | undefined;

/** Link state of Begin reading: which offered session to start. */
export interface HandoffState {
  sessionBuiltAt: number;
}

/** Offers a session built at `builtAt`, replacing an earlier offer. */
export function offerSession(cards: SessionCard[], builtAt: number): HandoffState {
  offered = { cards, builtAt };
  return { sessionBuiltAt: builtAt };
}

function stampOf(state: unknown): number | undefined {
  if (typeof state !== 'object' || state === null || !('sessionBuiltAt' in state)) return undefined;
  return typeof state.sessionBuiltAt === 'number' ? state.sessionBuiltAt : undefined;
}

/** An offer older than this is not taken: the learner's data may have moved on. */
const FRESH_MS = 30 * 60_000;

/**
 * The link state naming the session on offer while it is fresh, without taking it: Start's
 * daily mix (IA3) hands it to the session as Begin reading did.
 */
export function offeredState(now: number): HandoffState | undefined {
  if (!offered || now - offered.builtAt > FRESH_MS) return undefined;
  return { sessionBuiltAt: offered.builtAt };
}

/**
 * The offered session when `state` (a location's state) names it, once: a second take, another
 * stamp, no stamp or a stale offer gets undefined, and the caller builds a session itself.
 */
export function takeSession(state: unknown, now: number): SessionCard[] | undefined {
  const stamp = stampOf(state);
  if (stamp === undefined || offered?.builtAt !== stamp) return undefined;
  if (now - stamp > FRESH_MS) return undefined;
  const { cards } = offered;
  offered = undefined;
  return cards;
}
