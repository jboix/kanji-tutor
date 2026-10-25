import type { ReactNode } from 'react';
import { cx } from './cx.ts';
import { useT } from './i18n/i18n.tsx';
import styles from './practised-progress.module.css';
import { ProgressLine } from './progress-line.tsx';

export interface PractisedCount {
  /** Items practised. */
  done: number;
  /** Items in all. */
  total: number;
  /** Opened or practised at all; "Not started" before that. Defaults to `done > 0`. */
  started?: boolean | undefined;
}

export interface PractisedProgressProps extends PractisedCount {
  /**
   * inline: the thin line with the count beside it, as on a lesson card (spans, so it fits
   * inside a link). stacked: the count in bold over the line, as at the top of a lesson page.
   */
  layout?: 'inline' | 'stacked';
  /** A quiet fact on the count's line when stacked, e.g. "last practised 26 Oct". */
  aside?: ReactNode;
}

/** "6 of 20 practised", or "Not started": plain counts, never praise. */
function usePractisedText({ done, total, started }: PractisedCount): string {
  const t = useT();
  const begun = started ?? done > 0;
  return begun ? t('ui.practisedOf', { done, total }) : t('ui.notStarted');
}

/** A lesson's progress as plain facts: how many of its items are practised, and a thin line. */
export function PractisedProgress(props: PractisedProgressProps) {
  const t = useT();
  const { done, total, layout = 'inline', aside } = props;
  const text = usePractisedText(props);
  const bar = (
    <ProgressLine
      thin
      inline
      value={total > 0 ? done / total : 0}
      label={t('ui.progressOf', { line: text })}
    />
  );
  if (layout === 'inline') {
    return (
      <span className={styles.inline}>
        <span className={styles.grow}>{bar}</span>
        <span className={styles.count}>{text}</span>
      </span>
    );
  }
  return (
    <span className={styles.stacked}>
      <span className={styles.head}>
        <span className={cx(styles.count, styles.strong)}>{text}</span>
        {aside !== undefined && <span className={styles.aside}>{aside}</span>}
      </span>
      {bar}
    </span>
  );
}
