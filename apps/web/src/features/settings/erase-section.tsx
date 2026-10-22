import { useState } from 'react';
import type { Settings } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useServices } from '../../ui/services.tsx';
import { ExportButton } from './backup-section.tsx';
import { ConfirmRow } from './confirm-row.tsx';
import styles from './settings.module.css';

type Step = 'idle' | 'confirm' | 'erasing' | 'failed';

interface Props {
  /** Settings after an export, so "Last backup" updates. */
  onExported: (settings: Settings) => void;
  /** Where to go once everything is gone; a full reload so no state survives. */
  restart?: () => void;
}

function restartApp() {
  window.location.replace(import.meta.env.BASE_URL);
}

function useErase(restart: () => void) {
  const { backup } = useServices();
  const [step, setStep] = useState<Step>('idle');
  const erase = async () => {
    setStep('erasing');
    try {
      await backup.eraseAll();
      restart();
    } catch {
      setStep('failed');
    }
  };
  return { step, setStep, erase };
}

/** Deletes every piece of local data after one confirmation, with an export offered first. */
export function EraseSection({ onExported, restart = restartApp }: Props) {
  const { step, setStep, erase } = useErase(restart);
  const t = useT();
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('settings.erase')}</h2>
      <p className={styles.hint}>{t('settings.eraseHint')}</p>
      {step === 'idle' && (
        <button type="button" className={styles.button} onClick={() => setStep('confirm')}>
          {t('settings.eraseStart')}
        </button>
      )}
      {step === 'confirm' && (
        <ConfirmRow
          confirmLabel={t('settings.eraseDo')}
          onConfirm={() => void erase()}
          onCancel={() => setStep('idle')}
        >
          {t('settings.eraseConfirm')}
        </ConfirmRow>
      )}
      {step === 'confirm' && (
        <ExportButton onExported={onExported} label={t('settings.eraseExportFirst')} />
      )}
      {step === 'erasing' && <p className={styles.status}>{t('settings.erasing')}</p>}
      {step === 'failed' && (
        <p className={styles.status} role="alert">
          {t('settings.eraseFailed')}
        </p>
      )}
    </section>
  );
}
