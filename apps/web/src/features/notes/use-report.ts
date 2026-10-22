import { useEffect, useState } from 'react';
import { type WeekReport, weekStats } from '../../domain/services/index.ts';
import { useServices } from '../../ui/services.tsx';

/** This week's report, loaded once per visit; undefined while loading. */
export function useReport(now: number): WeekReport | undefined {
  const { repos } = useServices();
  const [report, setReport] = useState<WeekReport>();
  useEffect(() => {
    let live = true;
    void weekStats(repos, { now }).then((result) => {
      if (live) setReport(result);
    });
    return () => {
      live = false;
    };
  }, [repos, now]);
  return report;
}
