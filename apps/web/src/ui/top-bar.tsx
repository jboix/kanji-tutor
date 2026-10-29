import { isValidElement, type ReactNode } from 'react';
import { BackButton, type BackButtonProps, CloseToRoot } from './back-button.tsx';
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
  /** The name of the list a detail page belongs to ("Guides"), centred, in place of `center`. */
  section?: ReactNode;
}

/** A plain back (not a session's close, which passes its own icon) earns close at the end. */
function isBack(start: ReactNode): boolean {
  return (
    isValidElement<BackButtonProps>(start) && start.type === BackButton && !start.props.children
  );
}

/** The end slot: the screen's own buttons, then close to the last screen with the bottom bar. */
function End({ end, close }: { end: ReactNode; close: boolean }) {
  return (
    <div className={styles.side}>
      {end}
      {close && <CloseToRoot />}
    </div>
  );
}

/** The screen top bar from read/voice/compose/handwrite.html: 44px slots either side. */
export function TopBar({ start, center, end, title, section }: TopBarProps) {
  const close = isBack(start);
  if (title !== undefined) {
    return (
      <header className={styles.bar}>
        <div className={styles.side}>{start}</div>
        <h1 className={styles.title}>{title}</h1>
        {(end || close) && <End end={end} close={close} />}
      </header>
    );
  }
  return (
    <header className={styles.bar}>
      <div className={styles.side}>{start}</div>
      <div className={styles.center}>
        {section === undefined ? center : <span className={styles.section}>{section}</span>}
      </div>
      <End end={end} close={close} />
    </header>
  );
}
