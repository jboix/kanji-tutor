import { type FormEvent, type ReactNode, useId } from 'react';
import styles from './answer-input.module.css';
import { cx } from './cx.ts';
import { useT } from './i18n/i18n.tsx';
import { IconButton } from './icon-button.tsx';
import { SendIcon } from './icons.tsx';
import { useKanaField } from './use-kana-field.ts';

export interface AnswerInputProps {
  /** Accessible label (visually hidden), e.g. "Reading of 待って". */
  label: string;
  placeholder?: string;
  /** Called on Enter with the trimmed value; kana mode converts a trailing n to ん first. */
  onSubmit: (value: string) => void;
  /** answer: live romaji→kana, Klee One · ask: free text ("Ask about this sentence…"). */
  variant?: 'answer' | 'ask';
  /** A trailing button, e.g. `<IconButton size={36} aria-label="Ask by voice">`. */
  trailing?: ReactNode;
  /** Empty the field after submitting (ask box). */
  clearOnSubmit?: boolean;
  /** Its own submit arrow, so an answer goes without the return key (U9); on for answers. */
  submitButton?: boolean;
  disabled?: boolean;
}

/** The input pill from read.html, with live kana for answers. */
export function AnswerInput(props: AnswerInputProps) {
  const { label, placeholder, onSubmit, variant = 'answer', trailing, clearOnSubmit } = props;
  const kana = variant === 'answer';
  const { final, setValue, ...field } = useKanaField(kana);
  const id = useId();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const value = final();
    if (value === '') return;
    onSubmit(value);
    setValue(clearOnSubmit ? '' : value);
  };
  return (
    <form className={styles.pill} onSubmit={submit}>
      <label htmlFor={id} className="visually-hidden">
        {label}
      </label>
      <Field id={id} kana={kana} placeholder={placeholder} disabled={props.disabled} {...field} />
      {trailing !== undefined && <div className={styles.end}>{trailing}</div>}
      {(props.submitButton ?? kana) && (
        <SubmitButton disabled={props.disabled === true || field.value.trim() === ''} />
      )}
    </form>
  );
}

/** The bare arrow that sends the answer, at the pill's end: a 44px target (U9). */
function SubmitButton({ disabled }: { disabled: boolean }) {
  const t = useT();
  return (
    <IconButton
      type="submit"
      className={styles.send}
      aria-label={t('ui.submitAnswer')}
      disabled={disabled}
    >
      <SendIcon />
    </IconButton>
  );
}

type FieldProps = Omit<ReturnType<typeof useKanaField>, 'final' | 'setValue'> & {
  id: string;
  kana: boolean;
  placeholder: string | undefined;
  disabled: boolean | undefined;
};

function Field({ kana, ...rest }: FieldProps) {
  return (
    <input
      {...rest}
      className={cx(styles.input, kana && styles.kana)}
      lang={kana ? 'ja' : undefined}
      type="text"
      inputMode="text"
      enterKeyHint={kana ? 'done' : 'send'}
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
    />
  );
}
