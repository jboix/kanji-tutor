import { createContext, use, useEffect, useMemo, useRef } from 'react';
import { answerSpan } from '../../domain/services/index.ts';
import type { SessionCard, Target } from '../../domain/session-types.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { AnswerInput } from '../../ui/answer-input.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { MicIcon } from '../../ui/icons.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { useSlot } from '../../ui/slots.tsx';
import { TutorNext, useTutor } from '../../ui/tutor.tsx';
import { sentenceTopic } from './drill-tutor.ts';
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

/** The tutor on a sentence whose every target is answered, so nothing it says can spoil one. */
function useSentenceTutor(card: SessionCard, last: boolean) {
  const { t, language } = useI18n();
  const options = useMemo(() => {
    const words = card.targets.map((target) => target.surface);
    const starters = [
      t('exercises.tutorExplain'),
      ...words.slice(0, 1).map((x) => t('exercises.tutorReadAs', { x })),
    ];
    return {
      topic: { about: card.sentence.text, sentence: sentenceTopic(card.sentence, language) },
      starters,
    };
  }, [card, t, language]);
  const tutor = useTutor(options);
  return last ? tutor : undefined;
}

/**
 * After an answer: "Next sentence" (read.html), and once the sentence's last target is answered
 * the tutor beside it (Tutor-drill). It waits for the last target, so asking can't reveal a
 * reading still to be answered.
 */
export function NextActions({ card, last, onNext }: NextActionsProps) {
  const box = useFocus('[data-next]', card.sentence.id);
  const tutor = useSentenceTutor(card, last);
  return (
    <ActionBar>
      <TutorNext tutor={tutor}>
        <div ref={box} className={styles.next}>
          <PillButton data-next onClick={onNext}>
            <SessionCopy k={last ? 'nextSentence' : 'nextWord'} />
          </PillButton>
        </div>
      </TutorNext>
    </ActionBar>
  );
}
