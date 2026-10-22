import { useCallback, useEffect, useRef, useState } from 'react';
import { choosePractice, type StartPlan, startPlan } from '../../domain/services/index.ts';
import type { PracticeChoice } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';

/** What Start plays (IA2), with the pattern of a grammar plan for its line. */
export interface PracticeView {
  choice: PracticeChoice;
  plan: StartPlan;
  /** The pattern of the grammar point a grammar plan practises. */
  pattern?: string;
}

/**
 * The choice saved for Start and the round it plays now. Choosing saves at once; the round is
 * worked out again, and only the latest choice's round is kept.
 */
export function usePractice(now: number) {
  const { repos } = useServices();
  const [view, setView] = useState<PracticeView>();
  const latest = useRef(0);
  const load = useCallback(
    async (choice: PracticeChoice | undefined) => {
      const ticket = ++latest.current;
      const chosen = choice ?? (await repos.settings.get()).practice ?? 'mix';
      const plan = await startPlan(repos, now, chosen);
      const point =
        plan.kind === 'grammar' && plan.grammar && (await repos.grammar.get(plan.grammar));
      const next: PracticeView = { choice: chosen, plan };
      if (point) next.pattern = point.pattern;
      if (ticket === latest.current) setView(next);
    },
    [repos, now],
  );
  useEffect(() => {
    void load(undefined);
  }, [load]);
  const choose = useCallback(
    (choice: PracticeChoice) => {
      setView((prev) => prev && { ...prev, choice });
      void choosePractice(repos, choice).then(() => load(choice));
    },
    [repos, load],
  );
  return { view, choose };
}
