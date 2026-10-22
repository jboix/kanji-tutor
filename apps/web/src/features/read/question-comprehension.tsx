/**
 * 読解 (T6): the passage on ruled lines and its questions one at a time. After each answer the
 * line that proves it is highlighted, with its English, and every option is explained.
 */
import { type ReactNode, useState } from 'react';
import type { ComprehensionQuestion, ComprehensionSet } from '../../domain/questions/index.ts';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TapText } from '../../ui/word-tap.tsx';
import styles from './question.module.css';
import { AnswerLine, OptionList, OptionNotes, QuestionHeader } from './question-parts.tsx';
import { PassageText, usePassageLines } from './question-tap.tsx';
import type { DrillResult } from './session-state.ts';
import { SkipButton } from './skip-button.tsx';
import { useGradeSound } from './use-answer-sound.ts';
import { useQuestion } from './use-question.ts';

interface PassageProps {
  set: ComprehensionSet;
  evidence: number | undefined;
  /** The question asked: before its answer the lines open in no-spoil mode (D63). */
  question: ComprehensionQuestion;
  answered: boolean;
}

function Passage({ set, evidence, question, answered }: PassageProps) {
  const t = useT();
  const lines = usePassageLines(set);
  // A phrase-meaning question asks what a phrase means: its words stay shut until answered.
  const open = answered || question.type !== 'phrase-meaning';
  return (
    <section className={styles.passage} aria-label={t('questions.passage')}>
      {set.sentences.map((line, i) => (
        <p
          key={line.ja}
          lang="ja"
          className={cx(styles.passageLine, i === evidence && styles.evidence)}
          data-evidence={i === evidence ? '' : undefined}
        >
          <PassageText text={line.ja} line={lines[i]} open={open} beforeAnswer={!answered} />
        </p>
      ))}
    </section>
  );
}

interface StepProps {
  set: ComprehensionSet;
  question: ComprehensionQuestion;
  last: boolean;
  onNext: (right: boolean) => void;
}

function Step({ set, question, last, onNext }: StepProps) {
  const controls = useQuestion(question);
  const { answer } = controls;
  useGradeSound(answer?.grade);
  const proof = set.sentences[question.evidence];
  const t = useT();
  return (
    <>
      <QuestionHeader question={question} />
      <Passage
        set={set}
        evidence={answer ? question.evidence : undefined}
        question={question}
        answered={answer !== undefined}
      />
      <p lang="ja" className={styles.question}>
        {answer ? (
          <TapText text={question.question} id={`${question.id}:question`} />
        ) : (
          question.question
        )}
      </p>
      <OptionList question={question} answer={answer} onChoose={controls.choose} words />
      {!answer && <SkipButton onSkip={controls.skip} />}
      {answer && proof && (
        <p className={styles.translation}>
          {t('questions.lineProof', { line: question.evidence + 1, text: proof.en })}
        </p>
      )}
      {answer && <AnswerLine question={question} answer={answer} />}
      {answer && <OptionNotes question={question} />}
      {answer && (
        <PillButton onClick={() => onNext(answer.grade.verdict === 'correct')}>
          {t(last ? 'common.done' : 'questions.nextQuestion')}
        </PillButton>
      )}
    </>
  );
}

export interface ComprehensionViewProps {
  set: ComprehensionSet;
  /** After the last question: right when every answer was right. */
  onDone: (result: DrillResult) => void;
}

/** A passage and its 2–4 questions, one at a time (T6). */
export function ComprehensionView({ set, onDone }: ComprehensionViewProps) {
  const [step, setStep] = useState(0);
  const [right, setRight] = useState(true);
  const question = set.questions[step];
  if (!question) return null;
  const last = step + 1 >= set.questions.length;
  const next = (ok: boolean) => {
    if (last) onDone({ kind: 'comprehension', right: right && ok });
    else {
      setRight(right && ok);
      setStep(step + 1);
    }
  };
  return <Step key={question.id} set={set} question={question} last={last} onNext={next} />;
}

/** A passage card in the reading session (T6), under the session's top bar. */
export function PassageScreen(props: ComprehensionViewProps & { topBar: ReactNode }) {
  return (
    <Screen topBar={props.topBar} gap={22} enter={false}>
      <ComprehensionView set={props.set} onDone={props.onDone} />
    </Screen>
  );
}
