import { createContext, use, useEffect, useRef } from 'react';
import { answerSpan } from '../../domain/services/index.ts';
import type { SessionCard, Target } from '../../domain/session-types.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { AnswerInput } from '../../ui/answer-input.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { MicIcon } from '../../ui/icons.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { useSlot } from '../../ui/slots.tsx';
import styles from './read.module.css';
import { SessionCopy, useCopyText } from './session-copy.tsx';
import { SkipButton } from './skip-button.tsx';

export interface AnswerActionsProps {
  card: SessionCard;
  target: Target;
  onAnswer: (answer: string, mode: 'typed' | 'voice', durationMs?: number) => void;
  /** Answering by voice; kept by the session across targets, so the choice sticks. */
  voice: boolean;
  onVoice: (on: boolean) => void;
  /** "I don't know" (L4), right under the answer field. */
  onSkip: () => void;
}

function spanText(card: SessionCard, target: Target): string {
  return answerSpan(card.sentence, target.tokenIndex)
    .map((i) => card.sentence.tokens[i]?.surface ?? '')
    .join('');
}

/**
 * Focuses the first `selector` match in the box whenever `key` changes, so Enter submits an
 * answer and Enter again moves on (keyboard flow). `preventScroll` stops iOS from scrolling the
 * page to the field when the keyboard opens (U1): the layout already keeps it in view.
 */
export function useFocus(selector: string, key: string) {
  const box = useRef<HTMLDivElement>(null);
  const auto = use(AutoFocus);
  useEffect(() => {
    if (key && auto)
      box.current?.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
  }, [selector, key, auto]);
  return box;
}

/**
 * Whether an exercise takes the focus when it appears: yes in a session; not for the first drill
 * on a grammar page (S5), where it would open the keyboard before the learner has asked.
 */
export const AutoFocus = createContext(true);

/**
 * The typed answer with live kana (R3), or the voice slot (I2) when chosen, with "I don't know"
 * right under it (L4).
 */
export function AnswerActions(props: AnswerActionsProps) {
  const { card, target, onAnswer, voice, onVoice, onSkip } = props;
  const Voice = useSlot('voiceAnswer');
  const box = useFocus('input', `${card.sentence.id}:${target.tokenIndex}:${voice}`);
  const placeholder = useCopyText('prompt');
  const t = useT();
  if (Voice && voice) {
    const answer = (kana: string, ms: number) => onAnswer(kana, 'voice', ms);
    return (
      <ActionBar>
        <Voice card={card} target={target} onAnswer={answer} onTypeInstead={() => onVoice(false)} />
        <SkipButton onSkip={onSkip} />
      </ActionBar>
    );
  }
  const mic = Voice && (
    <IconButton size={36} muted aria-label={t('read.answerByVoice')} onClick={() => onVoice(true)}>
      <MicIcon />
    </IconButton>
  );
  return (
    <ActionBar>
      <div ref={box}>
        <AnswerInput
          label={t('drills.readingOf', { word: spanText(card, target) })}
          placeholder={placeholder}
          onSubmit={(value) => onAnswer(value, 'typed')}
          trailing={mic || undefined}
        />
      </div>
      <SkipButton onSkip={onSkip} />
    </ActionBar>
  );
}

export interface NextActionsProps {
  card: SessionCard;
  last: boolean;
  onNext: () => void;
}

/**
 * After an answer: the question box slot (A4) and "Next sentence" (read.html). The box waits for
 * the sentence's last target, so asking can't reveal a reading still to be answered.
 */
export function NextActions({ card, last, onNext }: NextActionsProps) {
  const Ask = useSlot('askBox');
  const box = useFocus('[data-next]', card.sentence.id);
  return (
    <ActionBar>
      {Ask && last && <Ask sentence={card.sentence} />}
      <div ref={box} className={styles.next}>
        <PillButton data-next onClick={onNext}>
          <SessionCopy k={last ? 'nextSentence' : 'nextWord'} />
        </PillButton>
      </div>
    </ActionBar>
  );
}
