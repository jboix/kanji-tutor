/**
 * 読解 (T6): the passage on ruled lines and its questions one at a time. After each answer the
 * line that proves it is highlighted, with its English, and every option is explained.
 */
import { type ReactNode, useState } from 'react';
import type { ComprehensionQuestion, ComprehensionSet } from '../../domain/questions/index.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TapText } from '../../ui/word-tap.tsx';
import styles from './question.module.css';
import { AnswerLine, OptionList, OptionNotes, QuestionHeader } from './question-parts.tsx';
import { PassageText, usePassageLines } from './question-tap.tsx';
import read from './read.module.css';
import { useFocus } from './read-actions.tsx';
import type { DrillResult } from './session-state.ts';
import { SkipButton } from './skip-button.tsx';
import { useGradeSound } from './use-answer-sound.ts';
import { useQuestion } from './use-question.ts';

interface PassageProps {
  set: ComprehensionSet;
  evidence: number | undefined;
  /** The question asked: before its answer the lines open in no-spoil mode. */
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
          className={styles.passageLine}
          data-evidence={i === evidence ? '' : undefined}
        >
          <span className={cx(i === evidence && styles.evidence)}>
            <PassageText text={line.ja} line={lines[i]} open={open} beforeAnswer={!answered} />
          </span>
        </p>
      ))}
    </section>
  );
}

/** Lays out a step's body and its footer: under a screen's top bar, or one after the other. */
export type PassageLayout = (body: ReactNode, footer: ReactNode) => ReactNode;

const stacked: PassageLayout = (body, footer) => (
  <>
    {body}
    {footer}
  </>
);

interface StepProps {
  set: ComprehensionSet;
  question: ComprehensionQuestion;
  last: boolean;
  onNext: (right: boolean) => void;
  layout: PassageLayout;
}

/** "Next question", or "Done" after the last, once answered: in the action bar, always in view. */
function NextQuestion(props: { last: boolean; onNext: () => void }) {
  const box = useFocus('[data-next]', 'answered');
  const t = useT();
  return (
    <ActionBar>
      <div ref={box} className={read.next}>
        <PillButton data-next onClick={props.onNext}>
          {t(props.last ? 'common.done' : 'questions.nextQuestion')}
        </PillButton>
      </div>
    </ActionBar>
  );
}

function Step({ set, question, last, onNext, layout }: StepProps) {
  const controls = useQuestion(question);
  const { answer } = controls;
  useGradeSound(answer?.grade);
  const proof = set.sentences[question.evidence];
  const t = useT();
  const footer = answer && (
    <NextQuestion last={last} onNext={() => onNext(answer.grade.verdict === 'correct')} />
  );
  const body = (
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
    </>
  );
  return layout(body, footer);
}

export interface ComprehensionViewProps {
  set: ComprehensionSet;
  /** After the last question: right when every answer was right. */
  onDone: (result: DrillResult) => void;
  /** Where "Next question" goes; after the step when not given. */
  layout?: PassageLayout;
}

/** A passage and its 2–4 questions, one at a time (T6). */
export function ComprehensionView({ set, onDone, layout = stacked }: ComprehensionViewProps) {
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
  return (
    <Step
      key={question.id}
      set={set}
      question={question}
      last={last}
      onNext={next}
      layout={layout}
    />
  );
}

/** A passage card in the reading session (T6), under the session's top bar. */
export function PassageScreen(props: ComprehensionViewProps & { topBar: ReactNode }) {
  const layout: PassageLayout = (body, footer) => (
    <Screen topBar={props.topBar} footer={footer} gap={22} enter={false}>
      {body}
    </Screen>
  );
  return <ComprehensionView set={props.set} onDone={props.onDone} layout={layout} />;
}
