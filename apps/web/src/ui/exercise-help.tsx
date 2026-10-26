/**
 * One help bar under every exercise but 読解 (U6): Show meaning, Explain this sentence (the
 * teach slot, static first, the tutor on a press) and Skip, in that order, in the same place.
 * Before the answer the caller passes the masked card, so the help gives nothing away.
 */
import { createContext, type ReactNode, use, useState } from 'react';
import { questionHintIn, questionTranslationIn, translationIn } from '../domain/localized.ts';
import type { SessionCard } from '../domain/session-types.ts';
import type { Sentence } from '../domain/types.ts';
import { Chip } from './chip.tsx';
import { EnMark } from './en-mark.tsx';
import styles from './exercise-help.module.css';
import { useI18n } from './i18n/i18n.tsx';
import { type BlankAnswer, useSlot } from './slots.tsx';

export interface ExerciseHelpProps {
  /** The exercise's real sentence: Show meaning reveals its translation. */
  sentence?: Sentence | undefined;
  /** A JLPT question: its translation, from `sentence` in the learner's language when it can (N9). */
  question?:
    | { kind?: string; translation?: string; sentenceId?: string; hint?: string }
    | undefined;
  /**
   * What "Explain this sentence" explains: the masked card before the answer, and for a
   * blank what it hides, for the tutor's hint (A19).
   */
  explain?: { card: SessionCard; step: number; blank?: BlankAnswer } | undefined;
  answered: boolean;
  /** Show the translation by itself once answered (questions); typed reading has its wrap-up. */
  meaningOnAnswer?: boolean;
  /** Show the translation from the start: a cloze whose meaning decides between forms that fit. */
  meaningFirst?: boolean;
  /** The exercise's own "I don't know", shown until the answer. */
  skip?: ReactNode;
}

/**
 * "New" chips for the exercise on screen (L7), put first in its help bar. The session provides
 * them when explanations are skipped; elsewhere there are none.
 */
export const ExerciseChips = createContext<ReactNode>(null);

/** Blank questions (J3, J4): the full translation would give the blank away before the answer. */
const BLANK_KINDS = new Set(['context-word', 'grammar-form']);

function useMeaning(props: ExerciseHelpProps) {
  const { language } = useI18n();
  const { question } = props;
  if (question && BLANK_KINDS.has(question.kind ?? '') && !props.answered) {
    return questionHintIn(question, language);
  }
  if (question) return questionTranslationIn(question, props.sentence, language);
  return props.sentence
    ? translationIn(props.sentence, language)
    : { value: undefined, fallback: false };
}

function Meaning({ text, english }: { text: string; english: boolean }) {
  return (
    <p className={styles.meaning} data-meaning="">
      {text}
      <EnMark english={english} />
    </p>
  );
}

/** The bar (see the module comment). Renders nothing it has nothing for. */
export function ExerciseHelp(props: ExerciseHelpProps) {
  const { t } = useI18n();
  const Help = useSlot('sentenceHelp');
  const [pressed, setPressed] = useState(false);
  const meaning = useMeaning(props);
  const shown =
    pressed || props.meaningFirst === true || (props.answered && props.meaningOnAnswer === true);
  const explain = props.explain;
  const chips = use(ExerciseChips);
  return (
    <div className={styles.help} data-exercise-help="">
      {shown && meaning.value && <Meaning text={meaning.value} english={meaning.fallback} />}
      <div className={styles.row}>
        {chips}
        {meaning.value && !shown && (
          <Chip onClick={() => setPressed(true)}>{t('ui.showMeaning')}</Chip>
        )}
        {Help && explain && <Help card={explain.card} step={explain.step} blank={explain.blank} />}
        {!props.answered && props.skip}
      </div>
    </div>
  );
}
