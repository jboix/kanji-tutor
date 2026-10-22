import { type FormEvent, useState } from 'react';
import { useT } from '../../ui/i18n/i18n.tsx';
import {
  isEmptyChoice,
  KNOWN_DRAFT,
  KnownImportFields,
  type SetKnownDraft,
  toChoice,
} from '../../ui/known-import-fields.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import type { ImportChoice } from '../../ui/use-known-import.ts';
import styles from './import.module.css';

/** The choices of the import page (K6). */
export function ImportForm({ onImport }: { onImport: (choice: ImportChoice) => void }) {
  const t = useT();
  const [draft, setDraft] = useState(KNOWN_DRAFT);
  const set: SetKnownDraft = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const choice = toChoice(draft);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!isEmptyChoice(choice)) onImport(choice);
  };
  return (
    <form className={styles.form} onSubmit={submit}>
      <KnownImportFields draft={draft} set={set} />
      <PillButton type="submit" disabled={isEmptyChoice(choice)}>
        {t('importScreen.import')}
      </PillButton>
    </form>
  );
}
