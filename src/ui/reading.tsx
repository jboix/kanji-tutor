import { cx } from './cx.ts';
import { useT } from './i18n/i18n.tsx';
import styles from './reading.module.css';

export interface ReadingProps {
  /** The reading in kana. */
  kana: string;
  /**
   * False when the reading came from AI and did not pass `verifyReading`. It is then shown with
   * a dashed underline and an "unverified" label, never as if it were checked (CLAUDE.md).
   */
  verified?: boolean;
}

/** A kana reading, with a visible marker when it is unverified. */
export function Reading({ kana, verified = true }: ReadingProps) {
  const t = useT();
  return (
    <span className={styles.wrap}>
      <span lang="ja" className={cx(styles.reading, !verified && styles.unverified)}>
        {kana}
      </span>
      {!verified && (
        <span className={styles.flag} title={t('ui.unverifiedTitle')}>
          {t('ui.unverified')}
        </span>
      )}
    </span>
  );
}
