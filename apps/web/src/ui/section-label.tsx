import type { ReactNode } from 'react';
import styles from './section-label.module.css';

/** Small caps-style label, e.g. "YOU'LL START WITH". Write it in sentence case; CSS uppercases. */
export function SectionLabel({
  children,
  as = 'div',
}: {
  children: ReactNode;
  as?: 'div' | 'h2' | 'h3';
}) {
  const Tag = as;
  return <Tag className={styles.label}>{children}</Tag>;
}

/** A section title with muted meta on the right and a rule under it (today.html). */
export function SectionHeader({ title, meta }: { title: ReactNode; meta?: ReactNode }) {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>{title}</h2>
      {meta !== undefined && <div className={styles.meta}>{meta}</div>}
    </div>
  );
}
