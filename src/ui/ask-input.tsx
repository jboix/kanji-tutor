import { type FormEvent, type ReactNode, useId, useState } from 'react';
import pill from './answer-input.module.css';
import styles from './ask-input.module.css';
import { cx } from './cx.ts';
import { KanaSwitch, KanjiCandidatePopup } from './kanji-candidates.tsx';
import { finalText, useJapaneseTyping } from './use-japanese-typing.ts';

export interface AskInputProps {
  /** Accessible label (visually hidden), e.g. "Ask about 待って". */
  label: string;
  placeholder?: string | undefined;
  /** Called on Enter with the trimmed question; the field empties after. */
  onSubmit: (question: string) => void;
  /** Buttons at the pill's end, e.g. the mic and the send arrow. */
  trailing?: ReactNode;
}

/** A free text field: no capitals, corrections or suggestions that would fight romaji. */
const FREE_TEXT = {
  type: 'text',
  enterKeyHint: 'send',
  autoCapitalize: 'none',
  autoComplete: 'off',
  autoCorrect: 'off',
  spellCheck: false,
} as const;

/**
 * The question pill of the Ask box (A4, C6): free text, in English or Japanese. The あ switch
 * turns romaji into kana as it is typed, and kanji spellings for the kana pop up above it.
 */
export function AskInput({ label, placeholder, onSubmit, trailing }: AskInputProps) {
  const [value, setValue] = useState('');
  const [kana, setKana] = useState(false);
  const mode = kana ? 'hiragana' : 'off';
  const typing = useJapaneseTyping<HTMLInputElement>(value, setValue, mode);
  const id = useId();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const question = finalText(value, mode).trim();
    if (question === '') return;
    onSubmit(question);
    setValue('');
  };
  return (
    <div className={styles.typing}>
      <KanjiCandidatePopup typing={typing} />
      <form className={cx(pill.pill, pill.outlined)} onSubmit={submit}>
        <label htmlFor={id} className="visually-hidden">
          {label}
        </label>
        <input
          ref={typing.ref}
          id={id}
          value={value}
          {...typing.handlers}
          className={cx(pill.input, kana && pill.kana)}
          lang={kana ? 'ja' : undefined}
          placeholder={placeholder}
          {...FREE_TEXT}
        />
        <div className={pill.end}>
          <KanaSwitch on={kana} onChange={setKana} />
          {trailing}
        </div>
      </form>
    </div>
  );
}
