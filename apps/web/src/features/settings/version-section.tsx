import { useState } from 'react';
import { BUILD, checkForUpdate, reloadFresh, type UpdateCheck } from '../../ui/app-update.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import styles from './settings.module.css';

type Status = UpdateCheck | 'checking' | 'failed';

const STATUS_KEY = {
  checking: 'settings.updateChecking',
  updating: 'settings.updateFound',
  latest: 'settings.updateLatest',
  unavailable: 'settings.updateUnavailable',
  failed: 'settings.updateFailed',
} as const;

function builtAt(iso: string, language: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Which build is running, with a check for updates and a fresh reload (N1e). */
export function VersionSection() {
  const { t, language } = useI18n();
  const [status, setStatus] = useState<Status | undefined>();
  const check = async () => {
    setStatus('checking');
    setStatus(await checkForUpdate().catch((): Status => 'failed'));
  };
  const when = builtAt(BUILD.at, language);
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('settings.version')}</h2>
      <p className={styles.hint}>
        {when
          ? t('settings.versionLine', { version: BUILD.version, id: BUILD.id, when })
          : BUILD.id}
      </p>
      <div className={styles.row}>
        <button type="button" className={styles.button} onClick={() => void check()}>
          {t('settings.updateCheck')}
        </button>
        <button type="button" className={styles.button} onClick={() => void reloadFresh()}>
          {t('settings.reloadFresh')}
        </button>
      </div>
      {status && (
        <p className={styles.hint} role="status">
          {t(STATUS_KEY[status])}
        </p>
      )}
      <p className={styles.hint}>{t('settings.reloadFreshHint')}</p>
    </section>
  );
}
