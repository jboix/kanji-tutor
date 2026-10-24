/**
 * "I can't listen now" on a listening exercise: for a while, listening exercises show their
 * sentence to read instead of playing it. Kept in memory, so a reload listens again.
 */
import type { Drill } from '../../domain/drills/index.ts';

/** How long listening stays written after "I can't listen now". */
export const LISTEN_LATER_MS = 15 * 60_000;

let quietUntil = 0;

/** Listening exercises are written from now until `LISTEN_LATER_MS` later. */
export function listenLater(now = Date.now()): void {
  quietUntil = now + LISTEN_LATER_MS;
}

/** True while listening exercises are written instead of played. */
export function listeningQuiet(now = Date.now()): boolean {
  return now < quietUntil;
}

/** The drill as shown: a listening exercise turns into its written twin while quiet. */
export function asShown(drill: Drill, quiet: boolean): Drill {
  if (!quiet || drill.kind !== 'listening' || drill.read) return drill;
  return { ...drill, read: true };
}
