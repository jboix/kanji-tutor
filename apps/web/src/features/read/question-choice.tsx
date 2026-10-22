/** 漢字読み, 表記, 文脈規定 and 文法形式の判断 (J1–J4): the sentence with its mark, and four rows. */
import type { ChoiceQuestion } from '../../domain/questions/index.ts';
import type { Sentence } from '../../domain/types.ts';
import { cx } from '../../ui/cx.ts';
import { questionHelpCard, stemFill } from '../../ui/exercise-cards.ts';
import { ExerciseHelp } from '../../ui/exercise-help.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { TapRun } from '../../ui/word-tap.tsx';
import styles from './question.module.css';
import { AnswerLine, OptionList, OptionNotes } from './question-parts.tsx';
import { aroundSpan, stemRange } from './question-tap.tsx';
import { SkipButton } from './skip-button.tsx';
import type { QuestionControls } from './use-question.ts';

interface StemProps {
  question: ChoiceQuestion;
  answered: boolean;
  /** The sentence the stem was cut from: with it, its words open the word sheet (U5). */
  sentence?: Sentence | undefined;
}

/** The sentence: the span underlined, or a blank until answered, then filled in. */
export function ChoiceStem({ question, answered, sentence }: StemProps) {
  const { stem } = question;
  const right = answered && question.options[question.answer] !== undefined;
  const blank = stem.mark === 'blank' && !answered;
  const range = stemRange(sentence, stem.before, stem.after);
  const t = useT();
  const around =
    sentence && range
      ? aroundSpan(sentence, range, answered, stemFill(question))
      : { before: stem.before, after: stem.after };
  const target =
    answered && sentence && range ? (
      <TapRun sentence={sentence} from={range.from} to={range.to} />
    ) : (
      stem.target
    );
  return (
    <p lang="ja" className={styles.stem}>
      {around.before}
      {blank ? (
        <span className={styles.blank} data-blank="">
          <span className="visually-hidden">{t('questions.blank')}</span>
        </span>
      ) : (
        <span
          className={cx(styles.underline, right && stem.mark === 'blank' && styles.filled)}
          data-mark=""
        >
          {target}
        </span>
      )}
      {around.after}
    </p>
  );
}

/** A J1–J4 question: sentence, options, the help bar (U6), then the explanations. */
export function ChoiceBody({
  question,
  controls,
  sentence,
}: {
  question: ChoiceQuestion;
  controls: QuestionControls;
  sentence?: Sentence | undefined;
}) {
  const { answer } = controls;
  const answered = answer !== undefined;
  return (
    <>
      <ChoiceStem question={question} answered={answered} sentence={sentence} />
      <OptionList
        question={question}
        answer={answer}
        onChoose={controls.choose}
        words={question.kind !== 'kanji-reading'}
      />
      <ExerciseHelp
        sentence={sentence}
        question={question}
        explain={questionHelpCard(question, sentence, answered)}
        answered={answered}
        meaningOnAnswer
        skip={<SkipButton onSkip={controls.skip} />}
      />
      {answer && <AnswerLine question={question} answer={answer} />}
      {answer && <OptionNotes question={question} />}
    </>
  );
}
