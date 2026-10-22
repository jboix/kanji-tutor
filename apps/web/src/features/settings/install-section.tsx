import { useI18n } from '../../ui/i18n/i18n.tsx';
import { ShareIcon } from '../../ui/icons.tsx';
import { promptInstall, useInstallWay } from '../../ui/install-prompt.ts';
import styles from './settings.module.css';

function InstallHow() {
  const { t, rich } = useI18n();
  const way = useInstallWay();
  if (way === 'prompt') {
    return (
      <button type="button" className={styles.primary} onClick={() => void promptInstall()}>
        {t('settings.installButton')}
      </button>
    );
  }
  if (way === 'ios') {
    const icon = (
      <span className={styles.inlineIcon} role="img" aria-label={t('settings.installShare')}>
        <ShareIcon />
      </span>
    );
    return <p className={styles.status}>{rich('settings.installIos', { icon })}</p>;
  }
  return <p className={styles.status}>{t('settings.installMenu')}</p>;
}

/**
 * Install help (N1b): the browser's own Install button where it offers one, the Share steps on
 * iOS, the browser menu elsewhere. Hidden once the app runs from the home screen.
 */
export function InstallSection() {
  const { t } = useI18n();
  const way = useInstallWay();
  if (way === 'installed') return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('settings.install')}</h2>
      <p className={styles.hint}>{t('settings.installLead')}</p>
      <InstallHow />
    </section>
  );
}
