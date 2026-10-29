import type { ReactNode } from 'react';
import styles from './sticky-actions.module.css';

/**
 * The primary action of a card in the scrolling body ("Got it", "Check"), held at the bottom of
 * the screen while the card scrolls under it, above the keyboard when it is open (S6, U1). It
 * stays in the flow, so at the end of the card it covers nothing. On a card too short to fill
 * the screen, it still sits at the bottom, not under the card's last line.
 */
export function StickyActions({ children }: { children: ReactNode }) {
  return (
    <div className={styles.sticky} data-sticky-actions="">
      {children}
    </div>
  );
}
