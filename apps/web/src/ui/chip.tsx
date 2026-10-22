import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './chip.module.css';
import { cx } from './cx.ts';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional leading icon, e.g. `<SpeakerIcon />` (voice.html "Hear しょうかい"). */
  icon?: ReactNode;
}

/** A follow-up action pill: 38px, radius 19, bordered (read.html, explain.html, kanji.html). */
export function Chip({ icon, children, className, type = 'button', ...rest }: ChipProps) {
  return (
    <button type={type} className={cx(styles.chip, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
}

/** Wrapping row of chips, 8px apart. */
export function ChipRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
