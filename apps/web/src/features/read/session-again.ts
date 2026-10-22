/**
 * "Take another session" on the session's end (D108): a fresh round of the same kind. The plain
 * daily mix asks Start's resolver (IA3) for its next round, a finished lesson asks it for the
 * saved choice, and any other session (a grammar point, a kanji reading, a unit, reading only)
 * plays its own request again.
 */
import { useCallback, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { type StartPlan, startPlan } from '../../domain/services/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import type { PracticeChoice } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';
import { startPath } from '../../ui/start-path.ts';
import type { AgainState, RetryState } from './session-round.ts';
import type { SessionRequest } from './use-session.ts';

/** Where another session comes from: Start's resolver (for a choice, or the saved one), or here. */
export type AgainPlan = { start: PracticeChoice | undefined } | { replay: true };

const isPlain = (request: SessionRequest) =>
  Object.values(request).every((value) => value === undefined);

/** The kind of round "Take another session" starts after `request`. */
export function againPlan(request: SessionRequest): AgainPlan {
  if (request.unit && request.section) return { start: undefined };
  return isPlain(request) ? { start: 'mix' } : { replay: true };
}

/** Starts the retry round of `cards` in place of the finished session (D117). */
export function useRetry(cards: readonly SessionCard[]) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  return useCallback(() => {
    const state: RetryState = { round: Date.now(), retry: [...cards] };
    void navigate(`${pathname}${search}`, { replace: true, state });
  }, [cards, pathname, search, navigate]);
}

/** Whatever goes wrong working it out, another session still starts: the daily mix. */
const FALLBACK: StartPlan = { kind: 'mix' };

/** Starts another round in place of the finished one; `busy` while Start's resolver works. */
export function useAgain(plan: AgainPlan) {
  const { repos } = useServices();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const [busy, setBusy] = useState(false);
  const again = useCallback(async () => {
    setBusy(true);
    const path =
      'replay' in plan
        ? `${pathname}${search}`
        : startPath(await startPlan(repos, Date.now(), plan.start).catch(() => FALLBACK));
    const state: AgainState = { round: Date.now() };
    await navigate(path, { replace: true, state });
  }, [plan, pathname, search, repos, navigate]);
  return { again, busy };
}
