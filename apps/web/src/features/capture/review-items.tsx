/**
 * What the pages teach, grouped by kind: each kanji, word and grammar point with its meaning,
 * JLPT level and the learner's state; and a handout's questions, as counts per type only, since
 * the tutor's answers stay hidden until the learner answers.
 */

import type { HandoutQuestion, QuestionType } from '../../domain/scan-types.ts';
import type { ScanItemView } from '../../domain/services/index.ts';
import { AiBlock } from '../../ui/ai-block.tsx';
import { cx } from '../../ui/cx.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { SectionLabel } from '../../ui/section-label.tsx';
import styles from './capture.module.css';
import review from './review.module.css';
import { STATE_LABELS, TYPE_LABELS } from './scan-copy.ts';

/** The meaning in the learner's language when a language pack has it, else English. */
function useMeaning(view: ScanItemView): string | undefined {
  const { language } = useI18n();
  const base = language.split('-')[0] ?? language;
  return view.meaningByLang?.[base] ?? view.meaning;
}

/** The meaning line: the gloss, then what is not in our lists or not verified. */
function detail(t: Translate, view: ScanItemView, meaning: string | undefined): string {
  const notes = [
    meaning ?? '',
    view.sentences === undefined ? '' : t('capture.sentencesToPractise', { n: view.sentences }),
    view.inLists ? '' : t('capture.notInLists'),
    view.readingVerified ? '' : t('capture.readingUnverified'),
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

function KanjiRow({ view }: { view: ScanItemView }) {
  const t = useT();
  const meaning = useMeaning(view);
  return (
    <li className={cx(review.itemRow, review.kanjiRow)}>
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
    </li>
  );
}

function WordRow({ view }: { view: ScanItemView }) {
  const t = useT();
  const meaning = useMeaning(view);
  return (
    <li className={review.itemRow}>
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
    </li>
  );
}

const COUNT_KEYS = {
  kanji: 'capture.kanjiCount',
  word: 'capture.wordsCount',
  grammar: 'capture.grammarCount',
} as const;

export function ItemGroup({
  kind,
  views,
}: {
  kind: ScanItemView['kind'];
  views: readonly ScanItemView[];
}) {
  const t = useT();
  const own = views.filter((view) => view.kind === kind);
  if (own.length === 0) return null;
  const title = t(COUNT_KEYS[kind], { n: own.length });
  const Row = kind === 'kanji' ? KanjiRow : WordRow;
  return (
    <section aria-label={title} className={review.group}>
      <SectionLabel as="h2">{title}</SectionLabel>
      <ul className={review.list}>
        {own.map((view) => (
          <Row key={view.key} view={view} />
        ))}
      </ul>
    </section>
  );
}

export function ReviewItems({ views }: { views: readonly ScanItemView[] }) {
  const t = useT();
  if (views.length === 0) return <p className={styles.muted}>{t('capture.nothingFound')}</p>;
  return (
    <>
      <ItemGroup kind="kanji" views={views} />
      <ItemGroup kind="word" views={views} />
      <ItemGroup kind="grammar" views={views} />
    </>
  );
}

function typeCounts(questions: readonly HandoutQuestion[]): [QuestionType, number][] {
  const counts = new Map<QuestionType, number>();
  for (const q of questions) counts.set(q.type, (counts.get(q.type) ?? 0) + 1);
  return [...counts];
}

export function PageExercises({ page, questions }: { page: number; questions: HandoutQuestion[] }) {
  const t = useT();
  const title = t('capture.exercisesFrom', { page: page + 1, n: questions.length });
  return (
    <section aria-label={title} className={review.group}>
      <SectionLabel as="h2">{title}</SectionLabel>
      <ul className={review.counts}>
        {typeCounts(questions).map(([type, n]) => (
          <li key={type}>{t('capture.questionTypeCount', { type: t(TYPE_LABELS[type]), n })}</li>
        ))}
      </ul>
    </section>
  );
}

/** Exercises per handout page as counts per type, and the note that the answers stay hidden. */
export function ReviewExercises({ questions }: { questions: readonly HandoutQuestion[] }) {
  const t = useT();
  if (questions.length === 0) return null;
  const pages = [...new Set(questions.map((q) => q.page))];
  return (
    <>
      {pages.map((page) => (
        <PageExercises
          key={page}
          page={page}
          questions={questions.filter((q) => q.page === page)}
        />
      ))}
      <AiBlock size="xs" tier="fast" label={t('capture.tutorAnswers')}>
        {t('capture.answersHidden')}
      </AiBlock>
    </>
  );
}
