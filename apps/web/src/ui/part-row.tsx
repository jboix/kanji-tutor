import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from './cx.ts';
import { useT } from './i18n/i18n.tsx';
import { ChevronIcon } from './icons.tsx';
import styles from './part-row.module.css';

export interface PartRowProps {
  /** The part's name: "Kanji", "言葉 · Words". */
  name: ReactNode;
  /** A Japanese sample of what it holds, on one line: "雨 晴 雪 曇 風". */
  sample?: string | undefined;
  /** A plain line in its place when there is no Japanese to sample. */
  detail?: ReactNode;
  /** Its items or parts done, shown as "2 of 5". */
  count?: { done: number; total: number } | undefined;
  /** A quiet word in place of the count, e.g. "Done". */
  aside?: ReactNode;
  /** The part to do next: its name stands out. */
  current?: boolean;
  /** Route to open; otherwise give `onClick`. */
  to?: string;
  onClick?: () => void;
}

function Inner({ name, sample, detail, count, aside, current }: PartRowProps) {
  const t = useT();
  const right = count ? t('ui.partOf', count) : aside;
  return (
    <>
      <span className={styles.lines}>
        <span className={cx(styles.name, current && styles.current)}>{name}</span>
        {sample ? (
          <span lang="ja" className={styles.sample}>
            {sample}
          </span>
        ) : (
          detail !== undefined && <span className={styles.detail}>{detail}</span>
        )}
      </span>
      <span className={styles.count}>{right}</span>
      <span className={styles.chevron}>
        <ChevronIcon />
      </span>
    </>
  );
}

/** One part of a lesson (Kanji, Words, Grammar…): its name, a sample, "2 of 5" and a chevron. */
export function PartRow(props: PartRowProps) {
  const { to, onClick } = props;
  if (to !== undefined) {
    return (
      <Link to={to} className={styles.row} onClick={onClick}>
        <Inner {...props} />
      </Link>
    );
  }
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <Inner {...props} />
    </button>
  );
}

/** A lesson's parts, ruled above, below and between. */
export function PartList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className={styles.list} aria-label={label}>
      {children}
    </section>
  );
}
