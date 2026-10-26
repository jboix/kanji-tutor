import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './chip.module.css';
import { cx } from './cx.ts';
import { TickIcon } from './icons.tsx';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional leading icon, e.g. `<SpeakerIcon />` (voice.html "Hear しょうかい"). */
  icon?: ReactNode;
  /** An answer chip once graded: right (green, with a check) or a correction. */
  'data-state'?: 'right' | 'miss' | undefined;
}

const isOn = (pressed: ChipProps['aria-pressed']) => pressed === true || pressed === 'true';

/**
 * A chip: 44px, soft fill, no edge. Pressed (`aria-pressed`) it turns tonal with a check; a
 * graded answer chip carries `data-state`.
 */
export function Chip({ icon, children, className, type = 'button', ...rest }: ChipProps) {
  const ticked = isOn(rest['aria-pressed']) || rest['data-state'] === 'right';
  return (
    <button type={type} className={cx(styles.chip, className)} {...rest}>
      {ticked ? <TickIcon /> : icon}
      {children}
    </button>
  );
}

/** Wrapping row of chips, 8px apart. */
export function ChipRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
