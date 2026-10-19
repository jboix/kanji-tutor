import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cx } from './cx.ts';
import { ChevronIcon } from './icons.tsx';
import styles from './list-row.module.css';

export interface ListRowProps {
  /** Main line (14px). */
  children: ReactNode;
  /** Muted line under it, or beside it when `inline`. */
  detail?: ReactNode;
  /** Detail on the same baseline (today.html kanji row). */
  inline?: boolean;
  /** Route to open; otherwise give `onClick`. */
  to?: string;
  onClick?: () => void;
}

function Inner({ children, detail, inline }: Omit<ListRowProps, 'to' | 'onClick'>) {
  return (
    <>
      <span className={cx(styles.main, inline && styles.inline)}>
        <span>{children}</span>
        {detail !== undefined && <span className={styles.detail}>{detail}</span>}
      </span>
      <span className={styles.chevron}>
        <ChevronIcon />
      </span>
    </>
  );
}

/** A tappable row, at least 56px, with a chevron (today.html). Rows share a rule between them. */
export function ListRow({ to, onClick, ...inner }: ListRowProps) {
  if (to !== undefined) {
    return (
      <Link to={to} className={styles.row} onClick={onClick}>
        <Inner {...inner} />
      </Link>
    );
  }
  return (
    <button type="button" className={styles.row} onClick={onClick}>
      <Inner {...inner} />
    </button>
  );
}
