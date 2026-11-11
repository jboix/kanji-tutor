/**
 * Where the answer to a handout question is typed. Romaji turns into kana as it is typed, as in
 * every other exercise. A reading or a particle is kana only, so it takes the answer field of the
 * readings. Any other answer may hold kanji: its field has the あ switch and offers kanji
 * spellings for the kana, as a sentence being composed does, and a Japanese keyboard types in it
 * as it is.
 */
import { type FormEvent, type ReactNode, useId, useState } from 'react';
import type { HandoutQuestion } from '../../domain/scan-types.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { AnswerInput } from '../../ui/answer-input.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { KanaToggle, KanjiCandidatePopup } from '../../ui/kanji-candidates.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { finalText, useJapaneseTyping } from '../../ui/use-japanese-typing.ts';
import { useKanaMode } from '../../ui/use-kana-mode.ts';
import styles from './handout.module.css';
import read from './read.module.css';
import { SkipButton } from './skip-button.tsx';
import type { HandoutControls } from './use-handout.ts';

/** No capitals, corrections or suggestions that would fight the romaji. */
const PLAIN = { autoCapitalize: 'none', autoComplete: 'off', spellCheck: false } as const;

/** Answered in kana alone. */
const kanaOnly = (type: HandoutQuestion['type']) => type === 'reading' || type === 'particle';

/** The answer as typed, the typing that turns it into Japanese, and the answer as sent. */
function useAnswerTyping<E extends HTMLInputElement | HTMLTextAreaElement>() {
  const [value, setValue] = useState('');
  const { mode, choose, native } = useKanaMode();
  const typing = useJapaneseTyping<E>(value, setValue, mode, { onNative: native });
  // Romaji left over (a last "n") becomes kana as the answer goes.
  const sent = () => finalText(value, mode, typing.from).trim();
  return { value, mode, choose, typing, sent };
}

type AnswerTyping = ReturnType<typeof useAnswerTyping>;

/** The field with the kanji popup laid out against it, and the あ switch at its end. */
function Typing(props: { answer: AnswerTyping; top?: boolean; children: ReactNode }) {
  const { answer, top, children } = props;
  return (
    <div className={styles.typing}>
      <KanjiCandidatePopup typing={answer.typing} />
      <div className={styles.fieldRow} data-top={top ? '' : undefined}>
        {children}
        <KanaToggle mode={answer.mode} onChange={answer.choose} />
      </div>
    </div>
  );
}

/** A short answer that may hold kanji, and Check; Enter checks it too. */
function WrittenActions({ controls }: { controls: HandoutControls }) {
  const t = useT();
  const id = useId();
  const answer = useAnswerTyping<HTMLInputElement>();
  const check = () => controls.answer(answer.sent());
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (answer.sent()) check();
  };
  return (
    <ActionBar>
      <form className={styles.field} onSubmit={submit}>
        <label htmlFor={id} className="visually-hidden">
          {t('read.yourAnswer')}
        </label>
        <Typing answer={answer}>
          <input
            id={id}
            lang="ja"
            type="text"
            enterKeyHint="done"
            className={styles.input}
            ref={answer.typing.ref}
            value={answer.value}
            placeholder={t('read.yourAnswer')}
            {...answer.typing.handlers}
            {...PLAIN}
          />
        </Typing>
      </form>
      <PillButton block disabled={!answer.value.trim()} onClick={check}>
        {t('read.check')}
      </PillButton>
      <SkipButton onSkip={controls.skip} />
    </ActionBar>
  );
}

/** A free answer, written before the tutor's shows. */
function FreeActions({ controls }: { controls: HandoutControls }) {
  const t = useT();
  const id = useId();
  const answer = useAnswerTyping<HTMLTextAreaElement>();
  return (
    <ActionBar>
      <div className={styles.field}>
        <label htmlFor={id} className={read.muted}>
          {t('read.yourAnswer')}
        </label>
        <Typing answer={answer} top>
          <textarea
            id={id}
            lang="ja"
            rows={3}
            className={styles.input}
            ref={answer.typing.ref}
            value={answer.value}
            {...answer.typing.handlers}
            {...PLAIN}
          />
        </Typing>
      </div>
      <PillButton block onClick={() => controls.answer(answer.sent())}>
        {t('read.showTutorAnswer')}
      </PillButton>
    </ActionBar>
  );
}

/** A reading or a particle: kana as it is typed, sent by Enter or the field's arrow. */
function KanaActions({ controls }: { controls: HandoutControls }) {
  const t = useT();
  const label = t('read.yourAnswer');
  return (
    <ActionBar>
      <AnswerInput label={label} placeholder={label} onSubmit={controls.answer} />
      <SkipButton onSkip={controls.skip} />
    </ActionBar>
  );
}

interface TypedProps {
  type: HandoutQuestion['type'];
  controls: HandoutControls;
}

/** The typed answer of a question that prints no choices. */
export function TypedActions({ type, controls }: TypedProps) {
  if (type === 'free') return <FreeActions controls={controls} />;
  if (kanaOnly(type)) return <KanaActions controls={controls} />;
  return <WrittenActions controls={controls} />;
}
