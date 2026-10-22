import { useEffect, useState } from 'react';
import {
  currentMix,
  type ProposedPlan,
  proposePlan,
  thisWeekPlan,
  type WeekReport,
  weekStats,
} from '../../domain/services/index.ts';
import type { WeeklyPlan } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';

/** This week's report, the plan proposed from it, and this week's plan if one was saved. */
export interface WeekData {
  report: WeekReport;
  proposal: ProposedPlan;
  saved?: WeeklyPlan;
}

async function loadWeek(repos: ReturnType<typeof useServices>['repos'], now: number) {
  const report = await weekStats(repos, { now });
  const proposal = proposePlan(report, await currentMix(repos, now));
  const saved = await thisWeekPlan(repos, now);
  const data: WeekData = { report, proposal };
  if (saved) data.saved = saved;
  return data;
}

/** Loads the week once per visit; undefined while loading. */
export function useWeek(now: number): WeekData | undefined {
  const { repos } = useServices();
  const [data, setData] = useState<WeekData>();
  useEffect(() => {
    let live = true;
    void loadWeek(repos, now).then((result) => {
      if (live) setData(result);
    });
    return () => {
      live = false;
    };
  }, [repos, now]);
  return data;
}
