/**
 * A handout question of a scanned lesson in a session: the learner's answer graded against the
 * tutor's (or, for a free answer, marked by the learner once the tutor's shows), recorded once,
 * and the page's photo, loaded from the lesson.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { HandoutQuestion, ScanPage } from '../../domain/scan-types.ts';
import { recordScanQuestion } from '../../domain/services/index.ts';
import type { Grade } from '../../domain/types.ts';
import { useServices } from '../../ui/services.tsx';

export interface HandoutControls {
  grade: Grade | undefined;
  /** A free answer: the tutor's answer shows, waiting for the learner's own mark. */
  revealed: boolean;
  answer: (value: string) => void;
  skip: () => void;
  /** A free answer: shows the tutor's. */
  reveal: () => void;
  /** A free answer: the learner's mark against the tutor's. */
  mark: (right: boolean) => void;
}

interface Attempt {
  value: string;
  skipped?: boolean;
  selfMarked?: boolean;
}

/** Records one attempt at the question, once, then hands its grade on. */
function useRecordHandout(
  lessonId: string,
  question: HandoutQuestion,
  grade: Grade | undefined,
  onGrade: (grade: Grade) => void,
) {
  const { repos } = useServices();
  const shownAt = useRef(Date.now());
  const busy = useRef(false);
  return useCallback(
    ({ value, skipped, selfMarked }: Attempt) => {
      if (busy.current || grade) return;
      busy.current = true;
      const now = Date.now();
      const durationMs = now - shownAt.current;
      const input = { lessonId, question, answer: value, now, durationMs, skipped, selfMarked };
      void recordScanQuestion(repos, input)
        .then(onGrade)
        .finally(() => {
          busy.current = false;
        });
    },
    [repos, lessonId, question, grade, onGrade],
  );
}

/** Answers, skips and marks of the question `question` of lesson `lessonId`. */
export function useHandout(lessonId: string, question: HandoutQuestion): HandoutControls {
  const [grade, setGrade] = useState<Grade>();
  const [revealed, setRevealed] = useState(false);
  const [given, setGiven] = useState('');
  const record = useRecordHandout(lessonId, question, grade, setGrade);
  const reveal = () => setRevealed(true);
  return {
    grade,
    revealed,
    answer: (value) => {
      if (question.type !== 'free') return record({ value });
      setGiven(value);
      reveal();
    },
    skip: () => record({ value: '', skipped: true }),
    reveal,
    mark: (right) => record({ value: given, selfMarked: right }),
  };
}

/** The page the question is printed on, from its lesson; undefined until loaded. */
export function useHandoutPage(lessonId: string, page: number): ScanPage | undefined {
  const { repos } = useServices();
  const [found, setFound] = useState<ScanPage>();
  useEffect(() => {
    let live = true;
    void repos.scans.get(lessonId).then((lesson) => live && setFound(lesson?.pages[page]));
    return () => {
      live = false;
    };
  }, [repos, lessonId, page]);
  return found;
}
