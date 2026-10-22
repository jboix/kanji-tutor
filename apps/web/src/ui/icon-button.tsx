import type { ButtonHTMLAttributes } from 'react';
import { cx } from './cx.ts';
import styles from './icon-button.module.css';

export type IconButtonSize = 36 | 44 | 48 | 52;

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons need a name. */
  'aria-label': string;
  /** 44 by default. 36 is drawn smaller but keeps a 44px touch target. */
  size?: IconButtonSize;
  /** plain: transparent · soft: paper-soft circle (undo) · outline: bordered circle. */
  look?: 'plain' | 'soft' | 'outline';
  /** Muted ink, like the ふ furigana toggle in read.html. */
  muted?: boolean;
  /** The content is a kana glyph (ふ, あ) rather than an icon, so it uses Klee One. */
  glyph?: boolean;
}

/** A round, icon-only button, at least 44×44 (N6). */
export function IconButton(props: IconButtonProps) {
  const {
    size = 44,
    look = 'plain',
    muted,
    glyph,
    className,
    type = 'button',
    children,
    ...rest
  } = props;
  const classes = cx(
    styles.button,
    size !== 44 && styles[`s${size}`],
    look !== 'plain' && styles[look],
    muted && styles.muted,
    glyph && styles.glyph,
    className,
  );
  return (
    <button type={type} className={classes} {...rest}>
      {glyph ? <span lang="ja">{children}</span> : children}
    </button>
  );
}
