import { useCallback, useEffect, useState } from 'react';
import type { CloudDevice, CloudPort } from '../../domain/cloud.ts';
import { CloudErrorText } from '../../ui/cloud-error-text.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { useCloudAction } from '../../ui/use-cloud-action.ts';
import { ConfirmRow } from './confirm-row.tsx';
import styles from './settings.module.css';

function DeviceRow({ device, onRemove }: { device: CloudDevice; onRemove: () => void }) {
  const { t, format } = useI18n();
  const [asking, setAsking] = useState(false);
  const seen = device.current
    ? t('account.deviceThis')
    : t('account.deviceSeen', { date: format.date(device.lastSeen, { dateStyle: 'medium' }) });
  return (
    <li className={styles.field}>
      <div className={styles.row}>
        <p className={styles.status}>
          <strong>{device.name}</strong> · {seen}
        </p>
        {!device.current && !asking && (
          <button type="button" className={styles.button} onClick={() => setAsking(true)}>
            {t('account.deviceRemove')}
          </button>
        )}
      </div>
      {asking && (
        <ConfirmRow
          confirmLabel={t('account.deviceRemove')}
          onConfirm={onRemove}
          onCancel={() => setAsking(false)}
        >
          {t('account.deviceRemoveQuestion', { name: device.name })}
        </ConfirmRow>
      )}
    </li>
  );
}

/** The account's devices, this one first; any other can be signed out from here. */
export function CloudDevices({ cloud }: { cloud: CloudPort }) {
  const t = useT();
  const { error, run } = useCloudAction();
  const [devices, setDevices] = useState<CloudDevice[]>([]);
  const load = useCallback(
    () =>
      run(
        () => cloud.devices(),
        (all) => setDevices([...all].sort((a, b) => +b.current - +a.current)),
      ),
    [cloud, run],
  );
  useEffect(() => void load(), [load]);
  const remove = (id: string) =>
    void run(
      () => cloud.removeDevice(id),
      () => void load(),
    );
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('account.devicesTitle')}</h2>
      <ul className={styles.list}>
        {devices.map((device) => (
          <DeviceRow key={device.id} device={device} onRemove={() => remove(device.id)} />
        ))}
      </ul>
      <CloudErrorText error={error} className={styles.status} />
    </section>
  );
}
