import { useState } from 'react';
import {
  BUILD,
  checkForUpdate,
  reloadFresh,
  type UpdateCheck,
  useAppUpdate,
} from '../../ui/app-update.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { UpdateCard } from '../../ui/update-card.tsx';
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

/** This build, and the newest one when a new version is waiting. */
function Facts() {
  const { t, language } = useI18n();
  const update = useAppUpdate();
  const when = builtAt(BUILD.at, language);
  const newest = update.status === 'none' ? undefined : update.next.version;
  return (
    <dl className={styles.stats}>
      <div className={styles.stat}>
        <dt>{t('settings.version')}</dt>
        <dd>
          {when
            ? t('settings.versionLine', { version: BUILD.version, id: BUILD.id, when })
            : BUILD.id}
        </dd>
      </div>
      {newest && (
        <div className={styles.stat}>
          <dt>{t('settings.versionNewest')}</dt>
          <dd>{newest}</dd>
        </div>
      )}
    </dl>
  );
}

/** Check for updates, while no new version is on offer. */
function Check() {
  const t = useT();
  const [status, setStatus] = useState<Status | undefined>();
  const check = async () => {
    setStatus('checking');
    setStatus(await checkForUpdate().catch((): Status => 'failed'));
  };
  return (
    <>
      <button type="button" className={styles.button} onClick={() => void check()}>
        {t('settings.updateCheck')}
      </button>
      {status && (
        <p className={styles.hint} role="status">
          {t(STATUS_KEY[status])}
        </p>
      )}
    </>
  );
}

/**
 * Which build is running, the new version when one waits, and a check for updates (N1e).
 * Reload fresh sits apart, as the way out when updating itself goes wrong.
 */
export function VersionSection() {
  const t = useT();
  const offered = useAppUpdate().status !== 'none';
  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.label}>{t('settings.version')}</h2>
        <UpdateCard place="settings" />
        <Facts />
        {!offered && <Check />}
      </section>
      <section className={styles.section}>
        <h2 className={styles.label}>{t('settings.updateTrouble')}</h2>
        <button type="button" className={styles.button} onClick={() => void reloadFresh()}>
          {t('settings.reloadFresh')}
        </button>
        <p className={styles.hint}>{t('settings.reloadFreshHint')}</p>
      </section>
    </>
  );
}
