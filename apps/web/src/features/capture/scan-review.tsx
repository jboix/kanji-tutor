/**
 * What the scan found (scans/Review): the suggested title to edit, the date, the pages with
 * their kind, the kanji, words and grammar they teach with level and state, and the handout's
 * exercises as counts. The tutor stays one tap away in the footer.
 */
import { type ReactNode, useId } from 'react';
import { scanProgress } from '../../domain/services/index.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { TutorNext } from '../../ui/tutor.tsx';
import styles from './capture.module.css';
import review from './review.module.css';
import { ReviewExercises, ReviewItems } from './review-items.tsx';
import { ReviewPages } from './review-pages.tsx';
import { useLessonTutor } from './scan-tutor.ts';
import type { ReviewModel } from './use-draft-review.ts';

export interface ScanReviewProps {
  model: ReviewModel;
  /** The back button. */
  back: ReactNode;
  /** The footer's action beside the tutor: Save, or Add pages. */
  action: ReactNode;
  /** A saved lesson: its title is saved when the field is left, and its progress shows. */
  saved?: { commitTitle: () => void } | undefined;
}

function TitleField({ model, saved }: Pick<ScanReviewProps, 'model' | 'saved'>) {
  const { t, format } = useI18n();
  const id = useId();
  const date = format.date(model.lesson.createdAt, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return (
    <div className={review.titleField}>
      <label htmlFor={id} className={styles.legend}>
        {saved ? t('capture.titleSaved') : t('capture.titleLabel')}
      </label>
      <input
        id={id}
        className={review.titleInput}
        value={model.title}
        onChange={(event) => model.setTitle(event.currentTarget.value)}
        onBlur={saved?.commitTitle}
      />
      <span className={styles.faint}>{saved ? t('capture.scannedOn', { date }) : date}</span>
    </div>
  );
}

/** "6 of 20 practised": plain counts, nothing more. */
function Practised({ model }: { model: ReviewModel }) {
  const t = useT();
  const { done, total } = scanProgress(model.lesson);
  if (total === 0) return null;
  return <p className={styles.muted}>{t('capture.practised', { done, total })}</p>;
}

function Footer({ model, action }: { model: ReviewModel; action: ReactNode }) {
  const tutor = useLessonTutor(model.lesson, model.title);
  return (
    <ActionBar>
      <TutorNext tutor={tutor}>{action}</TutorNext>
    </ActionBar>
  );
}

export function ScanReview({ model, back, action, saved }: ScanReviewProps) {
  const t = useT();
  const read = (
    <span className={styles.muted}>{t('capture.pagesRead', { n: model.lesson.pages.length })}</span>
  );
  return (
    <Screen
      topBar={<TopBar start={back} title={read} />}
      footer={<Footer model={model} action={action} />}
      gap={22}
      top={8}
    >
      <TitleField model={model} saved={saved} />
      {saved && <Practised model={model} />}
      <ReviewPages model={model} />
      {model.views ? <ReviewItems views={model.views} /> : null}
      <ReviewExercises questions={model.lesson.questions} />
    </Screen>
  );
}
