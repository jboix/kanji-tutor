import { useId } from 'react';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { BOOKS, type BookId, LAST_LESSON, lessonTag } from './class-books.ts';
import { KnownStatus } from './known-status.tsx';
import panels from './step-panels.module.css';
import { Lead, Note, StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';
import { classTag, offersMinna } from './use-wizard.ts';
import styles from './wizard.module.css';

type Props = Pick<StepProps, 'wizard'>;

/** None, the common textbooks, or another course: one choice, as chips on native radios. */
function Books({ wizard }: Props) {
  const t = useT();
  const name = useId();
  const choices: { id: BookId; label: string }[] = [
    { id: 'none', label: t('onboarding.classNone') },
    ...BOOKS.map((book) => ({ id: book.id, label: book.name })),
    { id: 'other', label: t('onboarding.classOther') },
  ];
  return (
    <fieldset className={panels.chips}>
      <legend className={styles.fieldLabel}>{t('onboarding.classTextbook')}</legend>
      {choices.map((choice) => (
        <label key={choice.id} className={panels.chip}>
          <input
            type="radio"
            name={name}
            checked={wizard.draft.book === choice.id}
            onChange={() => wizard.setDraft({ book: choice.id })}
          />
          <span>{choice.label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function OtherName({ wizard }: Props) {
  const t = useT();
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {t('onboarding.classOtherName')}
      </label>
      <input
        id={id}
        lang="ja"
        className={styles.input}
        value={wizard.draft.textbook}
        autoComplete="off"
        onChange={(event) => wizard.setDraft({ textbook: event.target.value })}
      />
    </div>
  );
}

/** The lesson you are on, 第1課 to 第50課, with − and +. */
function Lesson({ wizard }: Props) {
  const t = useT();
  const { lesson } = wizard.draft;
  const set = (n: number) => wizard.setDraft({ lesson: Math.min(Math.max(n, 1), LAST_LESSON) });
  return (
    <div className={panels.lesson}>
      <span className={panels.lessonText}>
        <span className={styles.fieldLabel}>{t('onboarding.classLesson')}</span>
        <span lang="ja" className={panels.lessonTag} aria-live="polite">
          {lessonTag(lesson)}
        </span>
      </span>
      <span className={panels.stepper}>
        <button
          type="button"
          className={panels.stepButton}
          aria-label={t('onboarding.classLessonDown')}
          disabled={lesson <= 1}
          onClick={() => set(lesson - 1)}
        >
          −
        </button>
        <button
          type="button"
          className={panels.stepButton}
          aria-label={t('onboarding.classLessonUp')}
          disabled={lesson >= LAST_LESSON}
          onClick={() => set(lesson + 1)}
        >
          +
        </button>
      </span>
    </div>
  );
}

/** What you already know: Minna's earlier lessons, and a pasted list (K6). No AI in either. */
function Known({ wizard }: Props) {
  const t = useT();
  const area = useId();
  const { known } = wizard.draft;
  const set = (change: Partial<typeof known>) =>
    wizard.setDraft({ known: { ...known, ...change } });
  return (
    <div className={panels.group}>
      {offersMinna(wizard.draft) && (
        <label className={panels.groupRow}>
          <span className={panels.rowText}>
            <span className={panels.rowTitle}>
              {t('onboarding.classMinnaKnown', { n: wizard.draft.lesson - 1 })}
            </span>
            <span className={panels.rowHint}>{t('onboarding.classMinnaHint')}</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-checked={known.minna}
            className={panels.switch}
            checked={known.minna}
            onChange={(event) => set({ minna: event.target.checked })}
          />
        </label>
      )}
      <details className={panels.paste} open={known.pasted !== '' || undefined}>
        <summary className={panels.groupRow}>
          <span className={panels.rowText}>
            <span className={panels.rowTitle}>{t('onboarding.classPaste')}</span>
            <span className={panels.rowHint}>{t('onboarding.classPasteHint')}</span>
          </span>
        </summary>
        <div className={panels.pasteBody}>
          <label htmlFor={area} className="visually-hidden">
            {t('onboarding.classPasteLabel')}
          </label>
          <textarea
            id={area}
            lang="ja"
            rows={4}
            className={panels.area}
            value={known.pasted}
            onChange={(event) => set({ pasted: event.target.value })}
          />
        </div>
      </details>
    </div>
  );
}

/**
 * Your class and what you know (K5, K6, D134): a textbook or None, the lesson, and words you
 * already know. Next saves the lesson tag and marks the known words; none of it needs the tutor.
 */
export function StepClass({ wizard, waiting }: Props & { waiting: boolean }) {
  const { t, rich } = useI18n();
  const { book } = wizard.draft;
  const tag = classTag(wizard.draft);
  return (
    <>
      <StepHeading>{t('onboarding.classHeading')}</StepHeading>
      <Lead>{t('onboarding.classLead')}</Lead>
      <Books wizard={wizard} />
      {book === 'other' && <OtherName wizard={wizard} />}
      {book !== 'none' && <Lesson wizard={wizard} />}
      <Known wizard={wizard} />
      <KnownStatus wizard={wizard} waiting={waiting} />
      {tag && <Note>{rich('onboarding.classTagged', { tag: <Ja>{tag}</Ja> })}</Note>}
      <Note>{t('onboarding.classNoAi')}</Note>
    </>
  );
}
