/**
 * 読解 (T6): the passage on ruled lines and its questions one at a time. After each answer the
 * line that proves it is highlighted, with its English, and every option is explained.
 */
import { type ReactNode, useId, useState } from 'react';
import type { ComprehensionQuestion, ComprehensionSet } from '../../domain/questions/index.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { ChevronIcon } from '../../ui/icons.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TutorNext } from '../../ui/tutor.tsx';
import { TapText } from '../../ui/word-tap.tsx';
import styles from './question.module.css';
import { AnswerLine, OptionList, OptionNotes, QuestionHeader } from './question-parts.tsx';
import { PassageText, usePassageLines } from './question-tap.tsx';
import { usePassageTutor } from './question-tutor.ts';
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

function PassageLines({ set, evidence, question, answered }: PassageProps) {
  const lines = usePassageLines(set);
  // A phrase-meaning question asks what a phrase means: its words stay shut until answered.
  const open = answered || question.type !== 'phrase-meaning';
  return set.sentences.map((line, i) => (
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
  ));
}

interface FoldProps extends PassageProps {
  /** Folded to its toggle, and once answered the line that proves it. */
  folded: boolean;
  onToggle: () => void;
}

/** The proving line alone, under a folded passage once the question is answered. */
function ProofLine({ set, evidence }: Pick<PassageProps, 'set' | 'evidence'>) {
  const line = evidence === undefined ? undefined : set.sentences[evidence];
  if (!line) return null;
  return (
    <p lang="ja" className={cx(styles.passage, styles.passageLine)} data-evidence="">
      <span className={styles.evidence}>{line.ja}</span>
    </p>
  );
}

/**
 * The passage on ruled lines, foldable so later questions do not sit under all of it: open for
 * the first question, folded for the next ones unless the learner opens it.
 */
function Passage({ folded, onToggle, ...lines }: FoldProps) {
  const t = useT();
  const id = useId();
  return (
    <section className={styles.passageBox} aria-label={t('questions.passage')}>
      <button
        type="button"
        className={styles.passageToggle}
        aria-expanded={!folded}
        aria-controls={id}
        onClick={onToggle}
      >
        <span>{t('questions.passage')}</span>
        <span className={styles.passageHint}>
          {t(folded ? 'questions.showPassage' : 'questions.hidePassage')}
        </span>
        <span className={cx(styles.passageChevron, !folded && styles.passageOpen)}>
          <ChevronIcon />
        </span>
      </button>
      <div id={id} className={styles.passage} hidden={folded}>
        {!folded && <PassageLines {...lines} />}
      </div>
      {folded && <ProofLine set={lines.set} evidence={lines.evidence} />}
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
  folded: boolean;
  onToggle: () => void;
  onNext: (right: boolean) => void;
  layout: PassageLayout;
}

interface NextQuestionProps {
  set: ComprehensionSet;
  question: ComprehensionQuestion;
  last: boolean;
  onNext: () => void;
}

/**
 * "Next question", or "Done" after the last, once answered: in the action bar, always in view,
 * with the tutor on the passage beside it (Tutor-drill).
 */
function NextQuestion(props: NextQuestionProps) {
  const box = useFocus('[data-next]', 'answered');
  const tutor = usePassageTutor(props.set, props.question);
  const t = useT();
  return (
    <ActionBar>
      <TutorNext tutor={tutor}>
        <div ref={box} className={read.next}>
          <PillButton data-next onClick={props.onNext}>
            {t(props.last ? 'common.done' : 'questions.nextQuestion')}
          </PillButton>
        </div>
      </TutorNext>
    </ActionBar>
  );
}

/** The question, its words tappable once answered. */
function Asked({ question, answered }: { question: ComprehensionQuestion; answered: boolean }) {
  return (
    <p lang="ja" className={styles.question}>
      {answered ? (
        <TapText text={question.question} id={`${question.id}:question`} />
      ) : (
        question.question
      )}
    </p>
  );
}

/** "Line 2: …": the proving line's English, once answered. */
function ProofTranslation({
  set,
  question,
}: {
  set: ComprehensionSet;
  question: ComprehensionQuestion;
}) {
  const t = useT();
  const proof = set.sentences[question.evidence];
  if (!proof) return null;
  return (
    <p className={styles.translation}>
      {t('questions.lineProof', { line: question.evidence + 1, text: proof.en })}
    </p>
  );
}

function Step({ set, question, last, folded, onToggle, onNext, layout }: StepProps) {
  const controls = useQuestion(question);
  const { answer } = controls;
  useGradeSound(answer?.grade);
  const footer = answer && (
    <NextQuestion
      set={set}
      question={question}
      last={last}
      onNext={() => onNext(answer.grade.verdict === 'correct')}
    />
  );
  const body = (
    <>
      <QuestionHeader question={question} />
      <Passage
        set={set}
        evidence={answer ? question.evidence : undefined}
        question={question}
        answered={answer !== undefined}
        folded={folded}
        onToggle={onToggle}
      />
      <Asked question={question} answered={answer !== undefined} />
      <OptionList question={question} answer={answer} onChoose={controls.choose} words />
      {!answer && <SkipButton onSkip={controls.skip} />}
      {answer && <ProofTranslation set={set} question={question} />}
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
  // Open on the first question, folded after it, unless the learner chose otherwise.
  const [open, setOpen] = useState<boolean>();
  const question = set.questions[step];
  if (!question) return null;
  const folded = !(open ?? step === 0);
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
      folded={folded}
      onToggle={() => setOpen(folded)}
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
