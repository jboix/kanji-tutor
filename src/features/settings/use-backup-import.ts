import { type ChangeEvent, useState } from 'react';
import { useT } from '../../ui/i18n/i18n.tsx';
import { useServices } from '../../ui/services.tsx';

export interface PendingImport {
  name: string;
  text: string;
}

export type ImportOutcome = { ok: boolean; message: string };

/** Pick a file, confirm, then replace all user data with it (K7). */
export function useBackupImport(onImported: () => Promise<void>) {
  const { backup } = useServices();
  const t = useT();
  const [pending, setPending] = useState<PendingImport>();
  const [outcome, setOutcome] = useState<ImportOutcome>();
  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setOutcome(undefined);
    setPending({ name: file.name, text: await file.text() });
  };
  const confirm = async (text: string) => {
    setPending(undefined);
    const result = await backup.importJson(text);
    if (result.ok) await onImported();
    setOutcome(
      result.ok
        ? { ok: true, message: t('settings.backupRestored') }
        : { ok: false, message: result.error },
    );
  };
  return { pending, outcome, pick, confirm, cancel: () => setPending(undefined) };
}
