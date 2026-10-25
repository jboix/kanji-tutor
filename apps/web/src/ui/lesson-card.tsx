import type { ReactNode } from 'react';
import { Link } from 'react-router';
import styles from './lesson-card.module.css';
import { type PractisedCount, PractisedProgress } from './practised-progress.tsx';

export interface LessonCardProps {
  /** The lesson's name (17px bold); Japanese goes in a `Ja`. */
  title: ReactNode;
  /** A quiet fact on the title's line: a date, or where the lesson is. */
  aside?: ReactNode;
  /** What the lesson holds, e.g. "3 pages · Kanji, grammar, exercises". */
  meta?: ReactNode;
  /** Its items practised, out of all of them. */
  progress: PractisedCount;
  /** Route to open; otherwise give `onClick`. */
  to?: string;
  onClick?: () => void;
}

function Inner({ title, aside, meta, progress }: Omit<LessonCardProps, 'to' | 'onClick'>) {
  return (
    <>
      <span className={styles.head}>
        <span className={styles.title}>{title}</span>
        {aside !== undefined && <span className={styles.aside}>{aside}</span>}
      </span>
      {meta !== undefined && <span className={styles.meta}>{meta}</span>}
      <PractisedProgress {...progress} />
    </>
  );
}

/**
 * One lesson in a list (Scanned lessons, units): a card on the raised paper with its name, a
 * quiet aside, what it holds and its plain progress line. The whole card opens the lesson.
 */
export function LessonCard({ to, onClick, ...inner }: LessonCardProps) {
  if (to !== undefined) {
    return (
      <Link to={to} className={styles.card} onClick={onClick}>
        <Inner {...inner} />
      </Link>
    );
  }
  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <Inner {...inner} />
    </button>
  );
}
