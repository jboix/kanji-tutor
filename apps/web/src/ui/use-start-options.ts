import { useEffect, useState } from 'react';
import type { Repos } from '../domain/repos.ts';
import { type StartPlan, startPlan } from '../domain/services/index.ts';
import { useServices } from './services.tsx';

/** What each choice in the Start sheet plays now. */
export interface StartOptions {
  /** The next lesson part; none when the path has no unit to go on with. */
  lesson?: Extract<StartPlan, { kind: 'lesson' }>;
  grammar: Extract<StartPlan, { kind: 'grammar' }>;
  /** The pattern of the grammar point the grammar choice practises. */
  pattern?: string;
  kanji: Extract<StartPlan, { kind: 'kanji' }>;
}

const narrow = <K extends StartPlan['kind']>(plan: StartPlan, kind: K) =>
  plan.kind === kind ? (plan as Extract<StartPlan, { kind: K }>) : undefined;

async function loadOptions(repos: Repos, now: number): Promise<StartOptions> {
  const [lesson, grammar, kanji] = await Promise.all([
    startPlan(repos, now, 'lesson'),
    startPlan(repos, now, 'grammar'),
    startPlan(repos, now, 'kanji'),
  ]);
  const focus = narrow(grammar, 'grammar') ?? { kind: 'grammar' };
  const point = focus.grammar ? await repos.grammar.get(focus.grammar) : undefined;
  const options: StartOptions = {
    grammar: focus,
    kanji: narrow(kanji, 'kanji') ?? { kind: 'kanji' },
  };
  const part = narrow(lesson, 'lesson');
  if (part) options.lesson = part;
  if (point) options.pattern = point.pattern;
  return options;
}

/**
 * The rounds the Start sheet offers, worked out each time it opens. Grammar and kanji without a
 * point or reading to focus on are the drills round, as Start has always played them.
 */
export function useStartOptions(open: boolean): StartOptions | undefined {
  const { repos } = useServices();
  const [options, setOptions] = useState<StartOptions>();
  useEffect(() => {
    if (!open) return;
    let live = true;
    void loadOptions(repos, Date.now()).then((next) => {
      if (live) setOptions(next);
    });
    return () => {
      live = false;
    };
  }, [open, repos]);
  return options;
}
