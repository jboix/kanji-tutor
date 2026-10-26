import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { type StartPlan, startPlan } from '../../domain/services/index.ts';
import { Loader } from '../../ui/loader.tsx';
import { Screen } from '../../ui/screen.tsx';
import { useServices } from '../../ui/services.tsx';
import { offeredState } from '../../ui/session-handoff.ts';
import { startPath } from '../../ui/start-path.ts';

/**
 * `/start`, the centre button (IA3): works out the next round from the choice saved on Today
 * and replaces itself with that session, so the session's close goes back to where Start was
 * pressed. The daily mix takes the session Today already built (N10).
 */
export function StartScreen() {
  const { repos } = useServices();
  const navigate = useNavigate();
  useEffect(() => {
    let live = true;
    // Whatever goes wrong working it out, Start still starts: the daily mix.
    const fallback: StartPlan = { kind: 'mix' };
    void startPlan(repos, Date.now())
      .catch(() => fallback)
      .then((plan) => {
        if (!live) return;
        const state = plan.kind === 'mix' ? offeredState(Date.now()) : undefined;
        void navigate(startPath(plan), { replace: true, state });
      });
    return () => {
      live = false;
    };
  }, [repos, navigate]);
  return (
    <Screen>
      <Loader />
    </Screen>
  );
}
