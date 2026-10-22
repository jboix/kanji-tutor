import type { ReactNode } from 'react';
import { cx } from './cx.ts';
import styles from './ja.module.css';

type JaVariant = 'inline' | 'emph' | 'line';

/** Japanese text inside UI copy: Klee One and `lang="ja"` (N7). */
export function Ja({ children, variant = 'inline' }: { children: ReactNode; variant?: JaVariant }) {
  return (
    <span lang="ja" className={cx(styles.ja, variant !== 'inline' && styles[variant])}>
      {children}
    </span>
  );
}

/** What the learner wrote, struck through in the correction colour (read.html). */
export function StruckAnswer({ children }: { children: ReactNode }) {
  return (
    <del lang="ja" className={styles.struck}>
      {children}
    </del>
  );
}

/** The corrected part of a reading, e.g. the う in しょうかい (voice.html, kanji.html). */
export function Fix({ children }: { children: ReactNode }) {
  return (
    <b lang="ja" className={styles.fix}>
      {children}
    </b>
  );
}
