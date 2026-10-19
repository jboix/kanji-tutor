import { useEffect, useState } from 'react';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import styles from './settings.module.css';
import { usageText } from './storage-format.ts';

type Persisted = 'unknown' | 'yes' | 'no';

function usePersisted() {
  const [persisted, setPersisted] = useState<Persisted>('unknown');
  useEffect(() => {
    void navigator.storage?.persisted?.().then((value) => setPersisted(value ? 'yes' : 'no'));
  }, []);
  const ask = async () => setPersisted((await navigator.storage.persist()) ? 'yes' : 'no');
  return { persisted, ask };
}

function useUsage() {
  const { t, format } = useI18n();
  const [estimate, setEstimate] = useState<{ usage?: number; quota?: number }>();
  useEffect(() => {
    void navigator.storage
      ?.estimate?.()
      .then(setEstimate)
      .catch(() => undefined);
  }, []);
  return estimate && usageText(estimate, t, format);
}

/** Whether the browser promised to keep this app's data, and how much it uses (N5). */
export function StorageSection() {
  const { persisted, ask } = usePersisted();
  const usage = useUsage();
  const { t } = useI18n();
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('settings.storage')}</h2>
      <p className={styles.status}>
        {persisted === 'yes' ? t('settings.storagePersistent') : t('settings.storageNotPersistent')}
      </p>
      {persisted === 'no' && (
        <button type="button" className={styles.button} onClick={ask}>
          {t('settings.storageAsk')}
        </button>
      )}
      {usage && <p className={styles.hint}>{usage}</p>}
    </section>
  );
}
