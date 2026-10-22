import type { ReactNode } from 'react';
import type { PlacementQuestion } from '../../domain/placement/index.ts';
import type { ChoiceQuestion, QuestionKind } from '../../domain/questions/index.ts';
import { questionHelpCard } from '../../ui/exercise-cards.ts';
import { ExerciseHelp } from '../../ui/exercise-help.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import styles from './placement.module.css';

/** The instruction under the section name (J7), in the learner's language. */
const PROMPT: Readonly<Partial<Record<QuestionKind, PlainKey>>> = {
  'kanji-reading': 'questions.promptKanjiReading',
  orthography: 'questions.promptOrthography',
  'grammar-form': 'questions.promptGrammarForm',
  comprehension: 'questions.promptComprehension',
};

function Stem({ question }: { question: ChoiceQuestion }) {
  const { stem } = question;
  const t = useT();
  return (
    <p lang="ja" className={styles.stem}>
      {stem.before}
      {stem.mark === 'blank' ? (
        <span className={styles.blank}>
          <span className="visually-hidden">{t('questions.blank')}</span>
        </span>
      ) : (
        <span className={styles.underline}>{stem.target}</span>
      )}
      {stem.after}
    </p>
  );
}

function Body({ item }: { item: PlacementQuestion }) {
  if (item.kind !== 'comprehension') {
    return <Stem question={item.question} />;
  }
  return (
    <>
      <div lang="ja" className={styles.passage}>
        {item.passage.map((line) => (
          <p key={line.ja}>{line.ja}</p>
        ))}
      </div>
      <p lang="ja" className={styles.stem}>
        {item.question.question}
      </p>
    </>
  );
}

/**
 * The help bar (U6) for placement's sentence questions: meaning and explanation of the stem as
 * shown, never the answer (D63). 読解 keeps its own layout and only the skip.
 */
function PlacementHelp({ item, skip }: { item: PlacementQuestion; skip: ReactNode }) {
  if (item.kind === 'comprehension') return skip;
  const { question } = item;
  return (
    <ExerciseHelp
      question={question}
      explain={questionHelpCard(question, undefined, false)}
      answered={false}
      skip={skip}
    />
  );
}

interface Props {
  item: PlacementQuestion;
  index: number;
  total: number;
  busy: boolean;
  onChoose: (option: number) => void;
}

/** One placement question: its JLPT section, the sentence or passage, and four options. */
export function PlacementQuestionView({ item, index, total, busy, onChoose }: Props) {
  const { question } = item;
  const t = useT();
  const prompt = PROMPT[question.kind];
  const count = t('placement.questionOf', { index, total });
  const skip = (
    <button type="button" className={styles.quiet} disabled={busy} onClick={() => onChoose(-1)}>
      {t('readSession.skip')}
    </button>
  );
  return (
    <section className={styles.card} aria-label={count}>
      <p className={styles.meta}>
        <span lang="ja">{question.section}</span> · {count}
      </p>
      {prompt && <p className={styles.prompt}>{t(prompt)}</p>}
      <Body item={item} />
      <div className={styles.options}>
        {question.options.map((option, at) => (
          <button
            key={option.text}
            type="button"
            className={styles.option}
            lang="ja"
            disabled={busy}
            onClick={() => onChoose(at)}
          >
            {option.text}
          </button>
        ))}
      </div>
      <PlacementHelp item={item} skip={skip} />
    </section>
  );
}
