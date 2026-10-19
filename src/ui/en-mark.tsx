/**
 * The "(en)" mark after a gloss, translation or app content shown in English because the
 * learner's language has no text for it (N9). Tiny and muted, a note named "in English" in the
 * interface language; renders nothing when `english` is false.
 */
import styles from './en-mark.module.css';
import { useT } from './i18n/i18n.tsx';

export function EnMark({ english = true }: { english?: boolean }) {
  const t = useT();
  if (!english) return null;
  const label = t('common.inEnglish');
  return (
    <span lang="en" role="note" aria-label={label} title={label} className={styles.mark}>
      {t('common.enMark')}
    </span>
  );
}
