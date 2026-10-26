import styles from './ai-seal.module.css';
import { cx } from './cx.ts';

export type SealSize = 16 | 22 | 24 | 28 | 44;

interface AiSealProps {
  size?: SealSize;
  /** The 〜 style-note seal from compose.html. */
  outline?: boolean;
  /** A dashed outline: the tutor is not set up yet. */
  dashed?: boolean;
}

/**
 * The 解 seal that marks AI-written text. Decorative: the note around it carries the accessible
 * label.
 */
export function AiSeal({ size = 24, outline = false, dashed = false }: AiSealProps) {
  return (
    // The glyph is drawn from data-seal by CSS: a mark, not label text (WCAG 2.5.3).
    <span
      aria-hidden="true"
      lang="ja"
      className={cx(
        styles.seal,
        size === 16 && styles.s16,
        size === 22 && styles.s22,
        size === 28 && styles.s28,
        size === 44 && styles.s44,
        outline && styles.outline,
        dashed && styles.dashed,
      )}
      data-seal={outline ? '〜' : '解'}
    />
  );
}

/**
 * The Tutor tab's seal in the bottom bar: solid crimson when the tab is active, an outline in the
 * bar's muted ink when not, dashed while the tutor is not set up.
 */
export function TabSeal({ active, unset }: { active: boolean; unset: boolean }) {
  return (
    <span
      aria-hidden="true"
      lang="ja"
      className={cx(styles.tab, active && styles.tabActive, unset && styles.tabUnset)}
      data-seal="解"
      data-unset={unset ? '' : undefined}
    />
  );
}
