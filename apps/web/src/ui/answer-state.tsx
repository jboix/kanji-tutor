import type { ReactNode } from 'react';
import type { Grade } from '../domain/types.ts';
import styles from './answer-state.module.css';
import { cx } from './cx.ts';
import { useT } from './i18n/i18n.tsx';

/** How an answer looks: right (green, check), a miss (crimson, cross), or skipped (quiet). */
export type AnswerLook = 'correct' | 'wrong' | 'skipped';

/** A near-miss is a miss here: only a right answer turns green. */
export function answerLook(grade: Pick<Grade, 'verdict' | 'skipped'>): AnswerLook {
  if (grade.skipped) return 'skipped';
  return grade.verdict === 'correct' ? 'correct' : 'wrong';
}

export interface AnswerStateProps {
  look: AnswerLook;
  /** The card's first line; a right answer says "Right" by default (W-answered). */
  title?: ReactNode;
  children?: ReactNode;
}

/**
 * The result card after an answer (U2, D105): green with a check in a circle when right, crimson
 * with a cross when not, the quiet surface when skipped. Never the 解 seal: that is the tutor's.
 * `data-answer` carries the state for tests and styles; the motion is dropped under reduced
 * motion.
 */
export function AnswerState({ look, title, children }: AnswerStateProps) {
  const t = useT();
  const heading = title ?? (look === 'correct' ? t('readSession.right') : undefined);
  return (
    <div className={cx(styles.state, styles[look])} data-answer={look}>
      {look !== 'skipped' && (
        <span className={styles.badge} aria-hidden="true">
          {look === 'correct' ? <CheckMark /> : <CrossMark />}
        </span>
      )}
      <div className={styles.body}>
        {heading && <strong className={styles.title}>{heading}</strong>}
        {children}
      </div>
    </div>
  );
}

/** The check stroke drawn after a right reading (~300 ms), white on the green circle. */
export function CheckMark() {
  return (
    <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true" data-check="">
      <path
        d="M5 12.5l4.5 4.5L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** The cross on the miss card's circle (W-error). */
function CrossMark() {
  return (
    <svg className={styles.cross} viewBox="0 0 24 24" aria-hidden="true" data-cross="">
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
