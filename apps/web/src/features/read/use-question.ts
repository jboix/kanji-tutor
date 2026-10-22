import { useCallback, useRef, useState } from 'react';
import { type Question, recordQuestionAnswer } from '../../domain/questions/index.ts';
import type { Grade } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';

/** The answer to one question: the option chosen (or none on a skip) and its grade. */
export interface QuestionAnswer {
  choice: number | undefined;
  grade: Grade;
}

export interface QuestionControls {
  answer: QuestionAnswer | undefined;
  /** Records the option chosen (for ★ order, the piece put in the ★ slot), once. */
  choose: (choice: number) => void;
  /** "I don't know" (L4): shows the answer, recorded as a skip (Again). */
  skip: () => void;
}

/** Answers one question once, recording it as a drill review (J1–J5, T6). */
export function useQuestion(question: Question): QuestionControls {
  const { repos } = useServices();
  const [answer, setAnswer] = useState<QuestionAnswer>();
  const shownAt = useRef(Date.now());
  const busy = useRef(false);
  const record = useCallback(
    (choice: number, skipped: boolean) => {
      if (busy.current) return;
      busy.current = true;
      const now = Date.now();
      const input = { question, choice, skipped, durationMs: now - shownAt.current, now };
      void recordQuestionAnswer(repos, input).then((grade) =>
        setAnswer({ choice: skipped ? undefined : choice, grade }),
      );
    },
    [repos, question],
  );
  const choose = useCallback((choice: number) => record(choice, false), [record]);
  const skip = useCallback(() => record(-1, true), [record]);
  return { answer, choose, skip };
}
