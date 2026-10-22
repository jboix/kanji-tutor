import type { ReactNode } from 'react';
import styles from './top-bar.module.css';

export interface TopBarProps {
  /** Usually an `IconButton` (close or back). An empty 44px slot keeps the centre centred. */
  start?: ReactNode;
  /** Session dashes, a title or a segmented control. */
  center?: ReactNode;
  end?: ReactNode;
  /**
   * The screen's name as its heading, left-aligned beside `start`, in place of `center`: the bar
   * stays put, so the name stays in view while the page scrolls.
   */
  title?: ReactNode;
}

/** The screen top bar from read/voice/compose/handwrite.html: 44px slots either side. */
export function TopBar({ start, center, end, title }: TopBarProps) {
  if (title !== undefined) {
    return (
      <header className={styles.bar}>
        <div className={styles.side}>{start}</div>
        <h1 className={styles.title}>{title}</h1>
        {end && <div className={styles.side}>{end}</div>}
      </header>
    );
  }
  return (
    <header className={styles.bar}>
      <div className={styles.side}>{start}</div>
      <div className={styles.center}>{center}</div>
      <div className={styles.side}>{end}</div>
    </header>
  );
}
