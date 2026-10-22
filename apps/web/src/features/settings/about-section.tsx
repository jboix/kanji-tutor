import { useI18n } from '../../ui/i18n/i18n.tsx';
import { CreditsSection } from './credits-section.tsx';
import styles from './settings.module.css';

/** What the app is and keeps to itself, a way back into the welcome wizard (P5), then the credits. */
export function AboutSection({ onWelcomeAgain }: { onWelcomeAgain: () => void }) {
  const { t } = useI18n();
  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.label}>{t('settings.about')}</h2>
        <p className={styles.hint}>{t('settings.aboutApp')}</p>
        <p className={styles.hint}>{t('settings.aboutPrivacy')}</p>
        <button type="button" className={styles.button} onClick={onWelcomeAgain}>
          {t('settings.welcomeAgain')}
        </button>
      </section>
      <CreditsSection />
    </>
  );
}
