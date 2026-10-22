import { useState } from 'react';
import type { CloudPort, CloudState } from '../../domain/cloud.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { paths } from '../../ui/paths.ts';
import { PillLink } from '../../ui/pill-button.tsx';
import { useCloud } from '../../ui/use-cloud.ts';
import { CloudDevices } from './cloud-devices.tsx';
import { CloudEmail } from './cloud-email.tsx';
import { CloudLink } from './cloud-link.tsx';
import { CloudThisDevice } from './cloud-this-device.tsx';
import styles from './settings.module.css';

const STATUS: Record<Exclude<CloudState['status'], 'saved'>, PlainKey> = {
  waiting: 'account.statusWaiting',
  saving: 'account.statusSaving',
  offline: 'account.statusOffline',
  paused: 'account.statusPaused',
  failed: 'account.statusFailed',
};

function SaveStatus({ cloud, state }: { cloud: CloudPort; state: CloudState }) {
  const { t, format } = useI18n();
  const [busy, setBusy] = useState(false);
  const saved = state.savedAt
    ? t('account.statusSaved', { time: format.date(state.savedAt, { timeStyle: 'short' }) })
    : t('account.statusUpToDate');
  const saveNow = async () => {
    setBusy(true);
    await cloud.saveNow().finally(() => setBusy(false));
  };
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('account.cloudTitle')}</h2>
      <p className={styles.status} role="status">
        {state.status === 'saved' ? saved : t(STATUS[state.status])}
      </p>
      <div className={styles.row}>
        <button type="button" className={styles.button} onClick={saveNow} disabled={busy}>
          {t('account.saveNow')}
        </button>
      </div>
    </section>
  );
}

function CloudOff() {
  const t = useT();
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('account.cloudTitle')}</h2>
      <p className={styles.status}>{t('account.cloudOff')}</p>
      <div className={styles.row}>
        <PillLink to={paths.cloudJoin}>{t('account.cloudTurnOn')}</PillLink>
        <PillLink to={paths.logIn} variant="secondary">
          {t('account.cloudLogIn')}
        </PillLink>
      </div>
      <p className={styles.hint}>{t('account.cloudLogInHint')}</p>
    </section>
  );
}

/** Settings → Cloud saves: off, with the ways to turn it on, or the save and the account. */
export function CloudSection() {
  const { cloud, state } = useCloud();
  if (!cloud) return null;
  if (!state.signedIn) return <CloudOff />;
  return (
    <>
      <SaveStatus cloud={cloud} state={state} />
      <CloudDevices cloud={cloud} />
      <CloudLink cloud={cloud} />
      <CloudEmail cloud={cloud} />
      <CloudThisDevice cloud={cloud} />
    </>
  );
}
