import { useId, useState } from 'react';
import type { Settings } from '../../domain/types.ts';
import { AiAction } from '../../ui/ai-action.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { KeyHelpDisclosure } from '../../ui/key-help.tsx';
import { ConfirmRow } from './confirm-row.tsx';
import styles from './settings.module.css';
import { type KeyTestState, useKeyTest } from './use-key-test.ts';
import type { PatchSettings } from './use-settings.ts';

interface Props {
  settings: Settings;
  onPatch: PatchSettings;
  /** The welcome wizard shows the key help itself, unfolded (P6). */
  help?: boolean;
  /** A typed key that passes Test key is saved too (the welcome wizard). */
  saveOnTest?: boolean;
}

function keyStatus(settings: Settings, notice: string, t: Translate): string {
  if (notice) return notice;
  return settings.apiKey ? t('settings.keySaved') : t('settings.keyNone');
}

function TestResult({ state }: { state: KeyTestState }) {
  const t = useT();
  if (state.status === 'idle') return null;
  const outcome = state.status === 'done' ? (state.ok ? 'works' : 'failed') : 'running';
  return (
    <p className={styles.status} role="status" data-outcome={outcome}>
      {state.status === 'running' ? t('settings.keyTesting') : state.message}
    </p>
  );
}

interface EntryProps {
  /** What the field shows: the typed draft, or else the saved key (masked until Show). */
  value: string;
  onDraft: (value: string) => void;
  onSave: () => void;
  canSave: boolean;
}

function KeyEntry({ value, onDraft, onSave, canSave }: EntryProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const t = useT();
  return (
    <div className={styles.row}>
      <label htmlFor={id} className="visually-hidden">
        {t('settings.keyField')}
      </label>
      <input
        id={id}
        className={styles.input}
        type={shown ? 'text' : 'password'}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        value={value}
        placeholder={t('settings.keyPlaceholder')}
        onChange={(event) => onDraft(event.target.value)}
      />
      <button
        type="button"
        className={styles.button}
        aria-pressed={shown}
        aria-label={shown ? t('settings.keyHideLabel') : t('settings.keyShowLabel')}
        onClick={() => setShown((value) => !value)}
      >
        {shown ? t('settings.keyHide') : t('settings.keyShow')}
      </button>
      <button type="button" className={styles.primary} onClick={onSave} disabled={!canSave}>
        {t('settings.save')}
      </button>
    </div>
  );
}

function RemoveKey({ onRemove }: { onRemove: () => Promise<void> }) {
  const [asking, setAsking] = useState(false);
  const t = useT();
  if (!asking) {
    return (
      <button type="button" className={styles.button} onClick={() => setAsking(true)}>
        {t('settings.keyRemove')}
      </button>
    );
  }
  const remove = async () => {
    setAsking(false);
    await onRemove();
  };
  return (
    <ConfirmRow
      confirmLabel={t('settings.keyRemoveConfirm')}
      onConfirm={remove}
      onCancel={() => setAsking(false)}
    >
      {t('settings.keyRemoveQuestion')}
    </ConfirmRow>
  );
}

/**
 * The key form. `draft` is undefined until the learner types, and the field then shows the saved
 * key, masked, so Show reveals it.
 */
function useKeyForm(settings: Settings, onPatch: PatchSettings, saveOnTest: boolean) {
  const [typed, setDraft] = useState<string>();
  const draft = typed ?? '';
  const [notice, setNotice] = useState('');
  const test = useKeyTest(settings.modelId);
  const t = useT();
  const store = async () => {
    await onPatch({ apiKey: draft.trim() });
    setDraft(undefined);
    setNotice(t('settings.keyNoticeSaved'));
  };
  const save = async () => {
    await store();
    test.reset();
  };
  const check = async (key: string) => {
    const works = await test.run(key);
    if (works && saveOnTest && draft.trim()) await store();
  };
  const remove = async () => {
    await onPatch({ apiKey: '' });
    setDraft(undefined);
    setNotice(t('settings.keyNoticeRemoved'));
    test.reset();
  };
  const value = typed ?? settings.apiKey ?? '';
  const canSave = draft.trim() !== '' && draft.trim() !== settings.apiKey;
  return { draft, value, canSave, setDraft, notice, test, check, save, remove };
}

/**
 * Gemini key, typed at runtime and kept in IndexedDB only (N3). The field holds the saved key
 * masked; Show reveals it on this screen, and it is never logged or put anywhere else.
 */
export function KeySection({ settings, onPatch, help = true, saveOnTest = false }: Props) {
  const id = useId();
  const form = useKeyForm(settings, onPatch, saveOnTest);
  const { draft, value, canSave, setDraft, notice, test, check, save, remove } = form;
  const key = draft.trim() || settings.apiKey || '';
  const t = useT();
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.label}>
        {t('settings.keyHeading')}
      </h2>
      <p className={styles.status}>{keyStatus(settings, notice, t)}</p>
      <KeyEntry value={value} onDraft={setDraft} onSave={save} canSave={canSave} />
      <div className={styles.wrap}>
        {/* The one request outside a task: it sends the key to Gemini once (N3, A18). */}
        <AiAction
          label={t('settings.keyTest')}
          disabled={!key || test.state.status === 'running'}
          run={() => void check(key)}
        />
        {settings.apiKey && <RemoveKey onRemove={remove} />}
      </div>
      <TestResult state={test.state} />
      <p className={styles.hint}>{t('settings.keyHint')}</p>
      {help && <KeyHelpDisclosure />}
    </section>
  );
}
