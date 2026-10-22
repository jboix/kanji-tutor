import type { CSSProperties, ReactNode } from 'react';
import { cx } from './cx.ts';
import { useEndLaunch } from './launch.ts';
import styles from './screen.module.css';
import { useVisualViewport } from './use-visual-viewport.ts';

export interface ScreenProps {
  children: ReactNode;
  /** Bottom nav, or an `ActionBar` (read.html, compose.html). */
  footer?: ReactNode;
  /** A `TopBar`; the body then starts 24px below it. */
  topBar?: ReactNode;
  /** Gap between body sections; 24px by default (mockups use 20 to 28). */
  gap?: number;
  /** Body top padding under a top bar; 24px by default (compose.html 16, handwrite.html 18). */
  top?: number;
  /**
   * The sections' entrance (D124), on unless false: a session's cards turn it off, so answering
   * never waits on it. A child can opt out alone with `data-enter="off"`.
   */
  enter?: boolean;
}

/**
 * Phone-width frame: optional top bar, a scrolling body and an optional footer. Its height follows
 * the visual viewport, so the footer sits right above the on-screen keyboard (U1).
 */
export function Screen({ children, footer, topBar, gap, top, enter = true }: ScreenProps) {
  const vars = {
    ...(gap === undefined ? {} : { '--screen-gap': `${gap}px` }),
    ...(top === undefined ? {} : { '--screen-top': `${top}px` }),
  } as CSSProperties;
  useVisualViewport();
  useEndLaunch();
  return (
    <div className={styles.frame}>
      {topBar}
      <main
        className={cx(styles.body, topBar !== undefined && styles.underBar)}
        style={vars}
        data-screen-body=""
        data-enter={enter ? undefined : 'off'}
      >
        {children}
      </main>
      {footer}
    </div>
  );
}
