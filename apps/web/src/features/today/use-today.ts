import { useEffect, useState } from 'react';
import {
  sharedReads,
  type TodayOverview,
  type TodaySession,
  todayOverview,
  todaySession,
} from '../../domain/services/index.ts';
import { canListen } from '../../lang/speech.ts';
import { useServices } from '../../ui/services.tsx';
import { type HandoffState, offerSession } from '../../ui/session-handoff.ts';

/** Today's session, offered on to Begin reading (N10). */
export interface TodaySessionView extends TodaySession {
  /** Begin reading's link state, which starts this same session. */
  handoff: HandoffState;
}

export interface TodayData {
  /** Undefined while loading; it comes first. */
  overview?: TodayOverview;
  /** Undefined while the session is being built; it fills in after the overview (N10). */
  session?: TodaySessionView;
}

/**
 * Today's data, computed once per visit (N10): the overview and the session start together, and
 * each shows as soon as it is known, so the screen does not wait for the session.
 */
export function useToday(now: number): TodayData {
  const { repos } = useServices();
  const [data, setData] = useState<TodayData>({});
  useEffect(() => {
    let live = true;
    const merge = (patch: TodayData) => live && setData((prev) => ({ ...prev, ...patch }));
    const shared = sharedReads(repos);
    void todayOverview(shared, now).then((overview) => merge({ overview }));
    const session = canListen().then((listening) => todaySession(shared, now, listening));
    void session.then((session) => {
      if (!live) return;
      merge({ session: { ...session, handoff: offerSession(session.cards, Date.now()) } });
    });
    return () => {
      live = false;
    };
  }, [repos, now]);
  return data;
}
