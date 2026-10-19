import type { KnowledgeLevel } from '../domain/types.ts';
import { cx } from './cx.ts';
import { useT } from './i18n/i18n.tsx';
import type { PlainKey } from './i18n/types.ts';
import styles from './knowledge-dots.module.css';

/** Plain-language names of the levels (K2), used as the dots' accessible label. */
export const LEVEL_LABELS: Record<KnowledgeLevel, PlainKey> = {
  0: 'ui.level0',
  1: 'ui.level1',
  2: 'ui.level2',
  3: 'ui.level3',
  4: 'ui.level4',
};

export interface KnowledgeDotsProps {
  level: KnowledgeLevel;
  /** Often misread: filled dots turn vermilion (kanji.html ショウ). */
  misread?: boolean;
  /** Overrides the default label for the level. */
  label?: string;
}

/** Four dots, filled up to the knowledge level (kanji.html). */
export function KnowledgeDots({ level, misread = false, label }: KnowledgeDotsProps) {
  const t = useT();
  const name = label ?? t(misread ? 'ui.levelMisread' : LEVEL_LABELS[level]);
  return (
    <span role="img" aria-label={name} className={cx(styles.dots, misread && styles.misread)}>
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={cx(styles.dot, n <= level && styles.filled)} />
      ))}
    </span>
  );
}
