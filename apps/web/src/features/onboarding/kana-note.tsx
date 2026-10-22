import { ExternalLink } from '../../ui/external-link.tsx';
import { KANA_GUIDE_URL } from '../../ui/external-links.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import styles from './wizard.module.css';

/**
 * The kana prerequisite (P8): the app expects hiragana and katakana, and a free guide teaches
 * them. On the welcome, and again under "I'm starting from zero".
 */
export function KanaNote() {
  const { t, rich } = useI18n();
  const link = (
    <ExternalLink site="tofugu" href={KANA_GUIDE_URL} subject={t('onboarding.kanaSubject')} />
  );
  return (
    <div className={styles.kana} data-kana-note="">
      <p className={styles.kanaLead}>{t('onboarding.kanaNeeded')}</p>
      <p className={styles.kanaText}>{rich('onboarding.kanaLearn', { link })}</p>
    </div>
  );
}
