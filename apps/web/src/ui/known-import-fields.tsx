import { useId } from 'react';
import type { JlptList } from '../domain/services/index.ts';
import { useT } from './i18n/i18n.tsx';
import type { PlainKey } from './i18n/types.ts';
import styles from './known-import.module.css';
import type { ImportChoice, PastedAs } from './use-known-import.ts';

/** What the known-words form holds while the learner fills it in (K6). */
export interface KnownDraft {
  n5: boolean;
  n4: boolean;
  minna: boolean;
  minnaUpTo: string;
  pasted: string;
  pastedAs: PastedAs;
  lesson: string;
}

/** The import page starts with the N5 list ticked. */
export const KNOWN_DRAFT: KnownDraft = {
  n5: true,
  n4: false,
  minna: false,
  minnaUpTo: '25',
  pasted: '',
  pastedAs: 'known',
  lesson: '',
};

/** Lesson numbers run 1 to 50 (Minna I and II). */
function lessonNumber(text: string): number | undefined {
  const n = Number.parseInt(text, 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, 50) : undefined;
}

/** The import a draft asks for. */
export function toChoice(draft: KnownDraft): ImportChoice {
  const lists: JlptList[] = [
    ...(draft.n5 ? ['n5' as const] : []),
    ...(draft.n4 ? ['n4' as const] : []),
  ];
  const minnaUpTo = draft.minna ? lessonNumber(draft.minnaUpTo) : undefined;
  return { lists, minnaUpTo, pasted: draft.pasted, pastedAs: draft.pastedAs, lesson: draft.lesson };
}

/** True when the choice would mark or add nothing. */
export function isEmptyChoice(choice: ImportChoice): boolean {
  return choice.lists.length === 0 && choice.minnaUpTo === undefined && !choice.pasted.trim();
}

/** Sets one field of the draft. */
export type SetKnownDraft = <K extends keyof KnownDraft>(key: K, value: KnownDraft[K]) => void;

interface FieldsProps {
  draft: KnownDraft;
  set: SetKnownDraft;
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <label className={styles.check}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function Lists({ draft, set }: FieldsProps) {
  const t = useT();
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{t('knownImport.lists')}</legend>
      <Check label={t('knownImport.n5')} checked={draft.n5} onChange={(on) => set('n5', on)} />
      <Check label={t('knownImport.n4')} checked={draft.n4} onChange={(on) => set('n4', on)} />
      <div className={styles.minna}>
        <Check
          label={t('knownImport.minnaUpTo')}
          checked={draft.minna}
          onChange={(on) => set('minna', on)}
        />
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          aria-label={t('knownImport.minnaLast')}
          className={styles.number}
          value={draft.minnaUpTo}
          onChange={(e) => set('minnaUpTo', e.target.value)}
        />
      </div>
      <p className={styles.hint}>{t('knownImport.listsHint')}</p>
    </fieldset>
  );
}

const PASTED_AS: readonly [PastedAs, PlainKey][] = [
  ['known', 'knownImport.pastedKnown'],
  ['new', 'knownImport.pastedNew'],
];

/** Whether the pasted words are already known (level 3) or new lesson words (level 0). */
function PastedKind({ draft, set }: FieldsProps) {
  const name = useId();
  const t = useT();
  return (
    <div role="radiogroup" aria-label={t('knownImport.pastedAs')} className={styles.kinds}>
      {PASTED_AS.map(([value, label]) => (
        <label key={value} className={styles.check}>
          <input
            type="radio"
            name={name}
            value={value}
            checked={draft.pastedAs === value}
            onChange={() => set('pastedAs', value)}
          />
          <span>{t(label)}</span>
        </label>
      ))}
      {draft.pastedAs === 'new' && <p className={styles.hint}>{t('knownImport.newHint')}</p>}
    </div>
  );
}

function LessonTag({ draft, set }: FieldsProps) {
  const lesson = useId();
  const t = useT();
  return (
    <>
      <label htmlFor={lesson} className={styles.label}>
        {t('knownImport.lessonTag')}
      </label>
      <input
        id={lesson}
        lang="ja"
        className={styles.text}
        placeholder={t('knownImport.lessonPlaceholder')}
        value={draft.lesson}
        onChange={(e) => set('lesson', e.target.value)}
      />
    </>
  );
}

function OwnList({ draft, set, known }: FieldsProps & { known: boolean }) {
  const pasted = useId();
  const t = useT();
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{t('knownImport.ownList')}</legend>
      <label htmlFor={pasted} className={styles.label}>
        {t('knownImport.ownListLabel')}
      </label>
      <textarea
        id={pasted}
        lang="ja"
        rows={5}
        className={styles.area}
        value={draft.pasted}
        onChange={(e) => set('pasted', e.target.value)}
      />
      {!known && <PastedKind draft={draft} set={set} />}
      {!known && <LessonTag draft={draft} set={set} />}
    </fieldset>
  );
}

/**
 * The known-words choices (K6): JLPT lists, Minna lessons and a pasted list. With `known`,
 * the pasted list is always words already known, with no lesson tag (the welcome wizard).
 */
export function KnownImportFields({
  draft,
  set,
  known = false,
}: FieldsProps & { known?: boolean }) {
  return (
    <>
      <Lists draft={draft} set={set} />
      <OwnList draft={draft} set={set} known={known} />
    </>
  );
}
