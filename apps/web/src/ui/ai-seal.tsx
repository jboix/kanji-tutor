import styles from './ai-seal.module.css';
import { cx } from './cx.ts';

export type SealSize = 16 | 22 | 24 | 28;

/**
 * The 解 seal that marks AI-written text. `outline` is the 〜 style-note seal from compose.html.
 * Decorative: the note around it carries the accessible label.
 */
export function AiSeal({ size = 24, outline = false }: { size?: SealSize; outline?: boolean }) {
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
        outline && styles.outline,
      )}
      data-seal={outline ? '〜' : '解'}
    />
  );
}
