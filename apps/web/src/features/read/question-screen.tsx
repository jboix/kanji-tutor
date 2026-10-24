/** A question card in the reading session (J1–J5, J7): its body, "I don't know", then Next. */
import type { ReactNode } from 'react';
import type { ChoiceQuestion, OrderQuestion } from '../../domain/questions/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TutorNext } from '../../ui/tutor.tsx';
import { ItemTeaching } from './item-teaching.tsx';
import { ChoiceBody } from './question-choice.tsx';
import { PassageScreen } from './question-comprehension.tsx';
import { OrderBody } from './question-order.tsx';
import { QuestionHeader } from './question-parts.tsx';
import { useQuestionTutor } from './question-tutor.ts';
import read from './read.module.css';
import { useFocus } from './read-actions.tsx';
import type { DrillResult } from './session-state.ts';
import { useGradeSound } from './use-answer-sound.ts';
import { useQuestion } from './use-question.ts';

/** Question kinds a session card carries; comprehension has its own view with the passage. */
export type SessionQuestion = ChoiceQuestion | OrderQuestion;

/** The word a word question is on, as the sentence writes it. */
const surfaceOf = (question: SessionQuestion) =>
  question.kind === 'sentence-order' ? '' : question.stem.target;

/** Once answered: the tutor's suggested questions and 解 button beside Next (Tutor-drill). */
function NextFooter({ question, onNext }: { question: SessionQuestion; onNext: () => void }) {
  const box = useFocus('[data-next]', 'answered');
  const tutor = useQuestionTutor(question);
  const t = useT();
  return (
    <ActionBar>
      <TutorNext tutor={tutor}>
        <div ref={box} className={read.next}>
          <PillButton data-next onClick={onNext}>
            {t('readSession.nextSentence')}
          </PillButton>
        </div>
      </TutorNext>
    </ActionBar>
  );
}

export interface QuestionScreenProps {
  question: SessionQuestion;
  /** The session card, for the teaching under a miss or a skip (L4). */
  card?: SessionCard;
  topBar: ReactNode;
  onDone: (result: DrillResult) => void;
}

/** One question: choose (or order, then check), see why each option is right or wrong, go on. */
export function QuestionScreen({ question, card, topBar, onDone }: QuestionScreenProps) {
  const controls = useQuestion(question);
  const { answer } = controls;
  useGradeSound(answer?.grade);
  const done = () => onDone({ kind: question.kind, right: answer?.grade.verdict === 'correct' });
  // Before the answer, "I don't know" sits in the help bar under the question (U6).
  const footer = answer && <NextFooter question={question} onNext={done} />;
  return (
    <Screen topBar={topBar} footer={footer} gap={22} enter={false}>
      <QuestionHeader question={question} />
      {question.kind === 'sentence-order' ? (
        <OrderBody question={question} controls={controls} sentence={card?.sentence} />
      ) : (
        <ChoiceBody question={question} controls={controls} sentence={card?.sentence} />
      )}
      <ItemTeaching
        card={card}
        itemId={question.itemId}
        surface={surfaceOf(question)}
        grade={answer?.grade}
      />
    </Screen>
  );
}

/**
 * The screen for a question or passage card (J1–J5, T6); the read session renders it for any
 * card with `question` or `passage` set.
 */
export function QuestionCardScreen(props: {
  card: SessionCard;
  topBar: ReactNode;
  onDone: (result: DrillResult) => void;
}) {
  const { card, topBar, onDone } = props;
  const { question } = card;
  if (question && question.kind !== 'comprehension') {
    return <QuestionScreen question={question} card={card} topBar={topBar} onDone={onDone} />;
  }
  const set = card.passage ?? {
    id: question?.id ?? card.sentence.id,
    sentences: [],
    questions: question ? [question] : [],
  };
  return <PassageScreen set={set} topBar={topBar} onDone={onDone} />;
}
