import type { ReactNode } from 'react';
import styles from './callout.module.css';
import { SectionLabel } from './section-label.tsx';

/** A soft panel with an optional label (today.html "You'll start with"). */
export function Callout({ label, children }: { label?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.callout}>
      {label !== undefined && <SectionLabel>{label}</SectionLabel>}
      {children}
    </section>
  );
}
