import { useState } from 'react';
import type { Settings } from '../../domain/types.ts';
import { downloadJson } from '../../ui/backup-reminder.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useServices } from '../../ui/services.tsx';
import {
  collectDiagnostics,
  diagnosticsFile,
  diagnosticsFileName,
  diagnosticsText,
} from './diagnostics.ts';
import styles from './settings.module.css';
import type { PatchSettings } from './use-settings.ts';

type Status = 'copied' | 'copyFailed' | 'saved';

const STATUS_KEY = {
  copied: 'settings.devCopied',
  copyFailed: 'settings.devCopyFailed',
  saved: 'settings.devSaved',
} as const;

/** Copy diagnostics and Save diagnostics file, and what came of the last one. */
function Actions() {
  const t = useT();
  const { repos } = useServices();
  const [status, setStatus] = useState<Status>();
  const copy = async () => {
    const text = diagnosticsText(await collectDiagnostics(repos));
    const copied = await navigator.clipboard?.writeText(text).then(
      () => true,
      () => false,
    );
    setStatus(copied ? 'copied' : 'copyFailed');
  };
  const save = async () => {
    const report = await collectDiagnostics(repos);
    downloadJson(diagnosticsFile(report), diagnosticsFileName(report.at));
    setStatus('saved');
  };
  return (
    <>
      <button type="button" className={styles.button} onClick={() => void copy()}>
        {t('settings.devCopy')}
      </button>
      <button type="button" className={styles.button} onClick={() => void save()}>
        {t('settings.devSave')}
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
 * Developer mode, at the end of About: off, one button turns it on; on, the diagnostics to copy
 * into a message or save as a file when reporting a problem, and the button to turn it off.
 */
export function DeveloperSection({
  settings,
  onPatch,
}: {
  settings: Settings;
  onPatch: PatchSettings;
}) {
  const t = useT();
  const on = settings.developerMode === true;
  return (
    <section className={styles.section}>
      <h2 className={styles.label}>{t('settings.developer')}</h2>
      <p className={styles.hint}>{t(on ? 'settings.devOnHint' : 'settings.devOffHint')}</p>
      {on && <Actions />}
      <button
        type="button"
        className={styles.button}
        aria-pressed={on}
        onClick={() => onPatch({ developerMode: !on })}
      >
        {t(on ? 'settings.devTurnOff' : 'settings.devTurnOn')}
      </button>
    </section>
  );
}
