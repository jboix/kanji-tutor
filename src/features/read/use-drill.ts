import { useCallback, useRef, useState } from 'react';
import type { Drill } from '../../domain/drills/index.ts';
import { recordDrillAnswer } from '../../domain/services/index.ts';
import type { Grade } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';
import type { DrillResult } from './session-state.ts';

/** One answered step of a drill: what was chosen or typed, and its grade. */
export interface DrillAnswer {
  answer: string;
  grade: Grade;
}

export interface DrillControls {
  /** Current step: the word of a "many readings" drill, else 0. */
  step: number;
  /** Answers so far, one per step. */
  answers: DrillAnswer[];
  /** The current step is answered, so its feedback shows. */
  answered: boolean;
  /** The current step is the drill's last. */
  last: boolean;
  /** Records a choice or a typed reading for the current step (once). */
  answer: (value: string) => void;
  /** "I don't know" (L4): shows the current step's answer, recorded as a skip (Again). */
  skip: () => void;
  /** Next step, or the end of the drill with its result. */
  next: () => void;
}

/** Steps in a drill: one per word for "many readings", one otherwise. */
export function drillSteps(drill: Drill): number {
  return drill.kind === 'readings' ? drill.items.length : 1;
}

type AddAnswer = (answer: DrillAnswer) => void;
type RecordStep = (value: string, skipped: boolean) => void;

/** Records the answer to a drill step once, ignoring taps while it is being saved. */
function useRecord(
  drill: Drill,
  step: number,
  shownAt: { current: number },
  add: AddAnswer,
): RecordStep {
  const { repos } = useServices();
  const busy = useRef(false);
  return useCallback(
    (value: string, skipped: boolean) => {
      if (busy.current) return;
      busy.current = true;
      const now = Date.now();
      const durationMs = now - shownAt.current;
      const input = { drill, step, answer: value, durationMs, now, skipped };
      void recordDrillAnswer(repos, input)
        .then((grade) => add({ answer: value, grade }))
        .finally(() => {
          busy.current = false;
        });
    },
    [repos, drill, step, shownAt, add],
  );
}

/** Steps through one drill card, recording each answer as a drill review (R8). */
export function useDrill(drill: Drill, onDone: (result: DrillResult) => void): DrillControls {
  const [answers, setAnswers] = useState<DrillAnswer[]>([]);
  const [step, setStep] = useState(0);
  const shownAt = useRef(Date.now());
  const answered = answers.length > step;
  const last = step + 1 >= drillSteps(drill);
  const add = useCallback((a: DrillAnswer) => setAnswers((list) => [...list, a]), []);
  const record = useRecord(drill, step, shownAt, add);
  const answer = useCallback(
    (value: string) => {
      if (!answered) record(value, false);
    },
    [answered, record],
  );
  const skip = useCallback(() => {
    if (!answered) record('', true);
  }, [answered, record]);
  const next = useCallback(() => {
    if (!answered) return;
    if (!last) {
      shownAt.current = Date.now();
      setStep((n) => n + 1);
      return;
    }
    onDone({ kind: drill.kind, right: answers.every((a) => a.grade.verdict === 'correct') });
  }, [answered, last, answers, drill.kind, onDone]);
  return { step, answers, answered, last, answer, skip, next };
}
