import { type FormEvent, useState } from 'react';
import { addGrammarPoint } from '../../domain/services/index.ts';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { useServices } from '../../ui/services.tsx';
import styles from './compose.module.css';

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ja?: boolean;
}) {
  return (
    <label className={styles.field}>
      {props.label.toUpperCase()}
      <input
        className={cx(styles.input, props.ja && styles.ja)}
        lang={props.ja ? 'ja' : undefined}
        value={props.value}
        placeholder={props.placeholder}
        autoComplete="off"
        onChange={(event) => props.onChange(event.target.value)}
      />
    </label>
  );
}

function useGrammarForm(lesson: string, onAdded: () => void) {
  const { repos } = useServices();
  const [pattern, setPattern] = useState('');
  const [meaning, setMeaning] = useState('');
  const [tag, setTag] = useState(lesson);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await addGrammarPoint(repos, { pattern, meaning, lesson: tag, now: Date.now() });
    onAdded();
  };
  const ready = pattern.trim() !== '' && meaning.trim() !== '';
  return { pattern, setPattern, meaning, setMeaning, tag, setTag, submit, ready };
}

/** For a learner with no grammar points yet: add one from the lesson (K1, K5). */
export function AddGrammarForm({ lesson, onAdded }: { lesson: string; onAdded: () => void }) {
  const t = useT();
  const { pattern, setPattern, meaning, setMeaning, tag, setTag, submit, ready } = useGrammarForm(
    lesson,
    onAdded,
  );
  return (
    <form className={styles.form} onSubmit={(event) => void submit(event)}>
      <p className={styles.prompt}>{t('compose.addLead')}</p>
      <Field
        label={t('compose.pattern')}
        value={pattern}
        onChange={setPattern}
        placeholder="〜わけではない"
        ja
      />
      <Field
        label={t('compose.meaning')}
        value={meaning}
        onChange={setMeaning}
        placeholder={t('compose.meaningPlaceholder')}
      />
      <Field
        label={t('compose.lesson')}
        value={tag}
        onChange={setTag}
        placeholder="Tobira 第4課"
        ja
      />
      <PillButton type="submit" block disabled={!ready}>
        {t('compose.addPoint')}
      </PillButton>
    </form>
  );
}
