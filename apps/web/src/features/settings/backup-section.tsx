import { useState } from 'react';
import type { Settings } from '../../domain/types.ts';
import { exportBackupFile } from '../../ui/backup-reminder.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { useServices } from '../../ui/services.tsx';
import { ConfirmRow } from './confirm-row.tsx';
import styles from './settings.module.css';
import { useBackupImport } from './use-backup-import.ts';

interface Props {
  settings: Settings;
  /** Settings after an export, so "Last backup" updates. */
  onExported: (settings: Settings) => void;
  /** Called after a successful import, to reload settings from the backup. */
  onImported: () => Promise<void>;
}

function LastBackup({ settings }: { settings: Settings }) {
  const { t, format } = useI18n();
  if (!settings.lastBackupAt) return <>{t('settings.backupNone')}</>;
  return <>{t('settings.backupLast', { date: format.date(settings.lastBackupAt) })}</>;
}

export function ExportButton({
  onExported,
  label,
}: Pick<Props, 'onExported'> & { label?: string }) {
  const services = useServices();
  const [busy, setBusy] = useState(false);
  const t = useT();
  const exportNow = async () => {
    setBusy(true);
    try {
      onExported(await exportBackupFile(services));
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" className={styles.primary} onClick={exportNow} disabled={busy}>
      {label ?? t('settings.backupExport')}
    </button>
  );
}

/** One-file export and import of all user data (K7). Import asks first, then replaces. */
export function BackupSection({ settings, onExported, onImported }: Props) {
  const { pending, outcome, pick, confirm, cancel } = useBackupImport(onImported);
  const t = useT();
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('settings.backup')}</h2>
      <p className={styles.status}>
        <LastBackup settings={settings} />
      </p>
      <div className={styles.row}>
        <ExportButton onExported={onExported} />
        <label className={styles.button}>
          {t('settings.backupImport')}
          <input
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            onChange={pick}
          />
        </label>
      </div>
      {pending && (
        <ConfirmRow
          confirmLabel={t('settings.backupReplace')}
          onConfirm={() => confirm(pending.text)}
          onCancel={cancel}
        >
          {t('settings.backupReplaceQuestion', { name: pending.name })}
        </ConfirmRow>
      )}
      {outcome && (
        <p className={styles.status} role={outcome.ok ? 'status' : 'alert'}>
          {outcome.message}
        </p>
      )}
      <p className={styles.hint}>{t('settings.backupHint')}</p>
    </section>
  );
}
