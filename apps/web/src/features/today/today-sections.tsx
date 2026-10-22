import { Link } from 'react-router';
import type { TodaySummary } from '../../domain/services/index.ts';
import { cx } from '../../ui/cx.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { paths } from '../../ui/paths.ts';
import styles from './today.module.css';
import { newReadingsLine } from './today-copy.ts';

/** Reading cards only: drills mixed into the session are exercises, not sentences to read. */
function sentenceCount(summary: TodaySummary): number {
  return summary.cards.filter((card) => card.reason !== 'drill').length;
}

/** Drills, questions and passages; grammar introductions are not exercises. */
function exerciseCount(summary: TodaySummary): number {
  return summary.cards.filter((card) => card.reason === 'drill' && !card.grammarIntro).length;
}

function NewReadings({ summary }: { summary: TodaySummary }) {
  const { t, rich } = useI18n();
  const { newReadings, progress } = summary;
  const count = sentenceCount(summary);
  const line =
    count === 1 && newReadings === 0
      ? t('today.readingsBefore')
      : newReadingsLine(t, count, newReadings);
  if (newReadings === 0 || !progress.lesson) return <>{t('today.sentence', { line })}</>;
  return <>{rich('today.lineFrom', { line, lesson: <JaRuns text={progress.lesson} /> })}</>;
}

/** "6 sentences and 4 exercises, about 5 minutes. Two of them carry new readings from …" */
export function Lead({ summary }: { summary: TodaySummary }) {
  const { t, rich } = useI18n();
  const count = sentenceCount(summary);
  if (count === 0) {
    const link = <Link to={paths.knownImport}>{t('today.nothingLink')}</Link>;
    return <p className={styles.text}>{rich('today.nothingToRead', { link })}</p>;
  }
  const sentences = <b>{t('today.sentences', { n: count })}</b>;
  const minutes = t('today.minutes', { n: summary.minutes });
  const n = exerciseCount(summary);
  const exercises = <b>{t('today.exercises', { n })}</b>;
  const lead =
    n === 0
      ? rich('today.toRead', { sentences, minutes })
      : rich('today.toDo', { sentences, exercises, minutes });
  // It fills in after the overview (N10), so it fades in rather than pops.
  return (
    <p className={cx(styles.text, 'enter')}>
      {lead} <NewReadings summary={summary} />
    </p>
  );
}
