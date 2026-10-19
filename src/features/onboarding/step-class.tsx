import { useId } from 'react';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { Lead, Note, StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';
import { joinLesson } from './steps.ts';
import styles from './wizard.module.css';

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

/** Textbook names and lesson tags mix Latin and kanji, so both fields use Klee One (D16). */
function Field({ label, value, placeholder, onChange }: FieldProps) {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.fieldLabel}>
        {label}
      </label>
      <input
        id={id}
        lang="ja"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

/** Your class (K5): textbook and lesson, saved on Next as the current lesson tag. */
export function StepClass({ wizard }: Pick<StepProps, 'wizard'>) {
  const { textbook, lesson } = wizard.draft;
  const { t, rich } = useI18n();
  const tag = joinLesson(textbook, lesson);
  return (
    <>
      <StepHeading>{t('onboarding.classHeading')}</StepHeading>
      <Lead>{t('onboarding.classLead')}</Lead>
      <Field
        label={t('onboarding.classTextbook')}
        value={textbook}
        placeholder="Tobira"
        onChange={(value) => wizard.setDraft({ textbook: value })}
      />
      <Field
        label={t('onboarding.classLesson')}
        value={lesson}
        placeholder="第4課"
        onChange={(value) => wizard.setDraft({ lesson: value })}
      />
      {tag && <Note>{rich('onboarding.classTagged', { tag: <Ja>{tag}</Ja> })}</Note>}
      <Note>{t('onboarding.classNoContent')}</Note>
    </>
  );
}
