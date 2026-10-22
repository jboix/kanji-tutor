import { useCallback, useState } from 'react';
import type { PlacementAnswer } from '../../ai/types.ts';
import {
  answerStep,
  nextKind,
  PLACEMENT_KINDS,
  type PlacementQuestion,
  placementQuestion,
  type Staircase,
  staircaseDone,
  startStaircase,
  usedId,
} from '../../domain/placement/index.ts';
import type { Repos } from '../../domain/repos.ts';
import { useServices } from '../../ui/services.tsx';
import { answerSummary } from './placement-copy.ts';

export type Phase = 'intro' | 'asking' | 'writing' | 'result';

export interface PlacementState {
  phase: Phase;
  stairs: Staircase;
  current?: PlacementQuestion | undefined;
  used: readonly string[];
  answers: readonly PlacementAnswer[];
  written: string;
}

const INITIAL: PlacementState = {
  phase: 'intro',
  stairs: startStaircase(),
  used: [],
  answers: [],
  written: '',
};

/** The kinds in turn from the one due next, so a level short of one kind still asks another. */
function kindsFrom(stairs: Staircase) {
  const at = PLACEMENT_KINDS.indexOf(nextKind(stairs));
  return [...PLACEMENT_KINDS.slice(at), ...PLACEMENT_KINDS.slice(0, at)];
}

/** The next question, or the writing step when the staircase is done or out of material. */
async function advance(repos: Repos, state: PlacementState, seed: string): Promise<PlacementState> {
  if (staircaseDone(state.stairs)) return { ...state, phase: 'writing', current: undefined };
  const current = await placementQuestion(repos, {
    level: state.stairs.level,
    kinds: kindsFrom(state.stairs),
    seed,
    used: new Set(state.used),
  });
  if (!current) return { ...state, phase: 'writing', current: undefined };
  return { ...state, phase: 'asking', current, used: [...state.used, usedId(current)] };
}

function answered(state: PlacementState, chosen: number): PlacementState {
  const { current } = state;
  if (!current) return state;
  const summary = answerSummary(current, chosen);
  const stairs = answerStep(state.stairs, current.kind, summary.right);
  return { ...state, stairs, answers: [...state.answers, summary] };
}

/**
 * Find my level (A11): the staircase over generated questions, then an optional written answer,
 * then the result. `choose(-1)` is "I don't know", counted as a wrong answer.
 */
export function usePlacement() {
  const { repos } = useServices();
  const [seed] = useState(() => String(Date.now()));
  const [state, setState] = useState<PlacementState>(INITIAL);
  const [busy, setBusy] = useState(false);
  const step = useCallback(
    async (from: PlacementState) => {
      setBusy(true);
      setState(await advance(repos, from, seed));
      setBusy(false);
    },
    [repos, seed],
  );
  const start = () => void step(INITIAL);
  const choose = (chosen: number) => void step(answered(state, chosen));
  const finish = (written: string) => setState({ ...state, written, phase: 'result' });
  return { state, busy, start, choose, finish };
}
