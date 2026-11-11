/**
 * What the pages teach, grouped by kind: each kanji, word and grammar point with its meaning,
 * JLPT level and the learner's state, and a handout's questions as printed, the tutor's answers
 * hidden until the learner answers. Each one has a tick, and each group a tick for all of it:
 * what is unticked stays listed, greyed, and is not practised.
 */

import type { ReactNode } from 'react';
import type { HandoutQuestion } from '../../domain/scan-types.ts';
import { isKept, questionKey, type ScanItemView } from '../../domain/services/index.ts';
import { AiBlock } from '../../ui/ai-block.tsx';
import { cx } from '../../ui/cx.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import styles from './capture.module.css';
import { GroupHead, KeptRow } from './keep-box.tsx';
import review from './review.module.css';
import { STATE_LABELS, TYPE_LABELS } from './scan-copy.ts';
import type { ReviewModel } from './use-draft-review.ts';

/** The meaning in the learner's language when a language pack has it, else English. */
function useMeaning(view: ScanItemView): string | undefined {
  const { language } = useI18n();
  const base = language.split('-')[0] ?? language;
  return view.meaningByLang?.[base] ?? view.meaning;
}

/** The meaning line: the gloss, then what is not in our lists, not verified, or an aside. */
function detail(t: Translate, view: ScanItemView, meaning: string | undefined): string {
  const notes = [
    meaning ?? '',
    view.sentences === undefined ? '' : t('capture.sentencesToPractise', { n: view.sentences }),
    view.inLists ? '' : t('capture.notInLists'),
    view.readingVerified ? '' : t('capture.readingUnverified'),
    view.instruction ? t('capture.fromInstructions') : '',
  ];
  return notes.filter(Boolean).join(' · ');
}

function Aside({ view }: { view: ScanItemView }) {
  const t = useT();
  return (
    <span className={review.itemAside}>
      <span className={styles.muted}>{view.jlpt ? `N${view.jlpt}` : t('capture.noLevel')}</span>
      <span className={cx(review.state, review[view.state])}>{t(STATE_LABELS[view.state])}</span>
    </span>
  );
}

interface RowProps {
  view: ScanItemView;
  model: ReviewModel;
}

/** A row with its tick; what is not in our lists cannot be practised, so it has none. */
function ItemRow(props: RowProps & { kanji?: boolean; children: ReactNode }) {
  const { view, model, kanji, children } = props;
  const row = cx(review.itemRow, kanji && review.kanjiRow);
  if (view.inLists) {
    return (
      <KeptRow itemKey={view.key} name={view.text} className={row} model={model}>
        {children}
      </KeptRow>
    );
  }
  return (
    <li className={row}>
      <span className={review.noKeep} />
      {children}
    </li>
  );
}

function KanjiRow({ view, model }: RowProps) {
  const t = useT();
  const meaning = useMeaning(view);
  return (
    <ItemRow view={view} model={model} kanji>
      <span lang="ja" className={review.kanjiChar}>
        {view.text}
      </span>
      <span className={review.itemMain}>
        <span>{detail(t, view, meaning)}</span>
        {view.reading && (
          <span lang="ja" className={review.itemReading}>
            {view.reading}
          </span>
        )}
      </span>
      <Aside view={view} />
    </ItemRow>
  );
}

function WordRow({ view, model }: RowProps) {
  const t = useT();
  const meaning = useMeaning(view);
  return (
    <ItemRow view={view} model={model}>
      <span className={review.itemMain}>
        <span>
          <span lang="ja" className={review.itemText}>
            {view.text}
          </span>{' '}
          {view.reading && (
            <span lang="ja" className={review.itemReading}>
              {view.reading}
            </span>
          )}
        </span>
        <span className={styles.muted}>{detail(t, view, meaning)}</span>
      </span>
      <Aside view={view} />
    </ItemRow>
  );
}

const COUNT_KEYS = {
  kanji: ['capture.kanjiCount', 'capture.kanjiCountKept', 'capture.keepAllKanji'],
  word: ['capture.wordsCount', 'capture.wordsCountKept', 'capture.keepAllWords'],
  grammar: ['capture.grammarCount', 'capture.grammarCountKept', 'capture.keepAllGrammar'],
} as const;

interface GroupProps {
  kind: ScanItemView['kind'];
  views: readonly ScanItemView[];
  model: ReviewModel;
}

export function ItemGroup({ kind, views, model }: GroupProps) {
  const t = useT();
  const own = views.filter((view) => view.kind === kind);
  if (own.length === 0) return null;
  const keys = own.filter((view) => view.inLists).map((view) => view.key);
  const left = keys.filter((key) => !isKept(model.lesson, key)).length;
  const [all, some, keepAll] = COUNT_KEYS[kind];
  const n = own.length;
  const title = left > 0 ? t(some, { kept: n - left, n }) : t(all, { n });
  const Row = kind === 'kanji' ? KanjiRow : WordRow;
  return (
    <section aria-label={title} className={review.group}>
      <GroupHead title={title} label={t(keepAll)} keys={keys} model={model} />
      <ul className={review.list}>
        {own.map((view) => (
          <Row key={view.key} view={view} model={model} />
        ))}
      </ul>
    </section>
  );
}

export function ReviewItems({ views, model }: Omit<GroupProps, 'kind'>) {
  const t = useT();
  if (views.length === 0) return <p className={styles.muted}>{t('capture.nothingFound')}</p>;
  return (
    <>
      <ItemGroup kind="kanji" views={views} model={model} />
      <ItemGroup kind="word" views={views} model={model} />
      <ItemGroup kind="grammar" views={views} model={model} />
    </>
  );
}

interface QuestionRowProps {
  question: HandoutQuestion;
  /** Its place on the page, for a question printed without a number. */
  n: number;
  model: ReviewModel;
}

/** A question as printed, with its number and what kind of question it is; never its answer. */
function QuestionRow({ question, n, model }: QuestionRowProps) {
  const t = useT();
  const number = question.number ?? String(n);
  return (
    <KeptRow
      itemKey={questionKey(question)}
      name={t('capture.questionN', { n: number })}
      className={review.itemRow}
      model={model}
    >
      <span className={review.itemMain}>
        <span lang="ja" className={review.stem}>
          {number}. {question.stem}
        </span>
        <span className={styles.muted}>{t(TYPE_LABELS[question.type])}</span>
      </span>
    </KeptRow>
  );
}

interface ExercisesProps {
  page: number;
  questions: readonly HandoutQuestion[];
  model: ReviewModel;
}

function PageExercises({ page, questions, model }: ExercisesProps) {
  const t = useT();
  const keys = questions.map(questionKey);
  const left = keys.filter((key) => !isKept(model.lesson, key)).length;
  const counts = { page: page + 1, n: keys.length, kept: keys.length - left };
  const title = t(left > 0 ? 'capture.exercisesFromKept' : 'capture.exercisesFrom', counts);
  const keepAll = t('capture.keepAllExercises', { page: page + 1 });
  return (
    <section aria-label={title} className={review.group}>
      <GroupHead title={title} label={keepAll} keys={keys} model={model} />
      <ul className={review.list}>
        {questions.map((question, i) => (
          <QuestionRow key={question.id} question={question} n={i + 1} model={model} />
        ))}
      </ul>
    </section>
  );
}

/** The questions of every handout page, page by page, each with its tick. */
export function AllExercises({ model }: { model: ReviewModel }) {
  const { questions } = model.lesson;
  const pages = [...new Set(questions.map((q) => q.page))];
  return pages.map((page) => (
    <PageExercises
      key={page}
      page={page}
      questions={questions.filter((q) => q.page === page)}
      model={model}
    />
  ));
}

/** Exercises per handout page as printed, and the note that the answers stay hidden. */
export function ReviewExercises({ model }: { model: ReviewModel }) {
  const t = useT();
  if (model.lesson.questions.length === 0) return null;
  return (
    <>
      <AllExercises model={model} />
      <AiBlock size="xs" tier="fast" label={t('capture.tutorAnswers')}>
        {t('capture.answersHidden')}
      </AiBlock>
    </>
  );
}
