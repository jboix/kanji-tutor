import type { ReactNode } from 'react';
import styles from './action-bar.module.css';

/** The bottom action area of read/compose/capture.html: a rule above, 12px 20px 32px. */
export function ActionBar({ children }: { children: ReactNode }) {
  return <div className={styles.bar}>{children}</div>;
}

/** Buttons side by side; children grow equally unless wrapped in `<ActionFixed>`. */
export function ActionRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

/** A child of `ActionRow` that keeps its own width (capture.html camera button). */
export function ActionFixed({ children }: { children: ReactNode }) {
  return <div className={styles.fixed}>{children}</div>;
}

/** A centred muted line under the actions (compose.html). */
export function ActionHint({ children }: { children: ReactNode }) {
  return <p className={styles.hint}>{children}</p>;
}
