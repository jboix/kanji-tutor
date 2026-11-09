import { createContext, type ReactNode, use } from 'react';
import styles from './action-bar.module.css';

/**
 * What a screen adds under whichever answer its bar holds, e.g. a drill's "I don't know" under its
 * choices or its typed field: one place for it, whatever the answer looks like.
 */
export const ActionBarEnd = createContext<ReactNode>(null);

/** The fixed bottom row (read/compose/capture.html): the bar colour, a hairline, 12px 16px. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className={styles.bar}>
      {children}
      {use(ActionBarEnd)}
    </div>
  );
}

/** Buttons side by side; children grow equally unless wrapped in `<ActionFixed>`. */
export function ActionRow({ children }: { children: ReactNode }) {
  return (
    <div className={styles.row} data-action-row="">
      {children}
    </div>
  );
}

/** A child of `ActionRow` that keeps its own width (capture.html camera button). */
export function ActionFixed({ children }: { children: ReactNode }) {
  return <div className={styles.fixed}>{children}</div>;
}

/** A centred muted line under the actions (compose.html). */
export function ActionHint({ children }: { children: ReactNode }) {
  return <p className={styles.hint}>{children}</p>;
}
