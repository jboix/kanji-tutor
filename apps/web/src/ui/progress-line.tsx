import type { ReactNode } from 'react';
import { cx } from './cx.ts';
import styles from './progress-line.module.css';

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export interface ProgressLineProps {
  /** 0 to 1. */
  value: number;
  label: string;
  /** Spans instead of divs, for a line inside phrasing content such as a link (T7). */
  inline?: boolean;
  /** The line of a lesson's progress (lesson cards and pages); the same 4px as any other. */
  thin?: boolean;
}

/** A straight 4px accent line on the track (W-today; capture, units, learned). */
export function ProgressLine({ value, label, inline = false, thin = false }: ProgressLineProps) {
  const percent = Math.round(clamp(value) * 100);
  const Tag = inline ? 'span' : 'div';
  return (
    <Tag
      className={cx(styles.track, thin && styles.thin)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <Tag className={styles.fill} style={{ width: `${percent}%` }} />
    </Tag>
  );
}

export interface ProgressRowProps {
  label: ReactNode;
  /** e.g. "19 of 28". */
  valueText: string;
  done: number;
  total: number;
}

/** Label, count and line in one ruled row (today.html "This week in class"). */
export function ProgressRow({ label, valueText, done, total }: ProgressRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.head}>
        <span>{label}</span>
        <span className={styles.value}>{valueText}</span>
      </div>
      <ProgressLine value={total > 0 ? done / total : 0} label={valueText} />
    </div>
  );
}
