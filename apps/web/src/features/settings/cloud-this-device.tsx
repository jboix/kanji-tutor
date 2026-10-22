import { useState } from 'react';
import type { CloudPort } from '../../domain/cloud.ts';
import { CloudErrorText } from '../../ui/cloud-error-text.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useCloudAction } from '../../ui/use-cloud-action.ts';
import { ConfirmRow } from './confirm-row.tsx';
import styles from './settings.module.css';

type Asking = 'log-out' | 'delete' | undefined;

/** This device: one more passkey, logging out, or deleting the account; the last two ask first. */
export function CloudThisDevice({ cloud }: { cloud: CloudPort }) {
  const t = useT();
  const { busy, error, run } = useCloudAction();
  const [asking, setAsking] = useState<Asking>(undefined);
  const [added, setAdded] = useState(false);
  const addPasskey = () =>
    void run(
      () => cloud.addPasskey(),
      () => setAdded(true),
    );
  const confirm = () => {
    setAsking(undefined);
    void run(() => (asking === 'delete' ? cloud.deleteAccount() : cloud.logOut()));
  };
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('account.thisDeviceTitle')}</h2>
      <p className={styles.hint}>{t('account.passkeyHint')}</p>
      <div className={styles.row}>
        <button type="button" className={styles.button} onClick={addPasskey} disabled={busy}>
          {t('account.passkeyAdd')}
        </button>
        <button type="button" className={styles.button} onClick={() => setAsking('log-out')}>
          {t('account.logOut')}
        </button>
        <button type="button" className={styles.button} onClick={() => setAsking('delete')}>
          {t('account.deleteAccount')}
        </button>
      </div>
      {added && (
        <p className={styles.status} role="status">
          {t('account.passkeyAdded')}
        </p>
      )}
      {asking && (
        <ConfirmRow
          confirmLabel={asking === 'delete' ? t('account.deleteConfirm') : t('account.logOut')}
          onConfirm={confirm}
          onCancel={() => setAsking(undefined)}
        >
          {asking === 'delete' ? t('account.deleteQuestion') : t('account.logOutQuestion')}
        </ConfirmRow>
      )}
      <CloudErrorText error={error} className={styles.status} />
    </section>
  );
}
