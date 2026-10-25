/**
 * What the scan found (scans/Review): the suggested title to edit, the date, the pages with
 * their kind, the kanji, words and grammar they teach with level and state, and the handout's
 * exercises as counts. The tutor stays one tap away in the footer.
 */
import { type ReactNode, useId } from 'react';
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
}

function TitleField({ model }: Pick<ScanReviewProps, 'model'>) {
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
        {t('capture.titleLabel')}
      </label>
      <input
        id={id}
        className={review.titleInput}
        value={model.title}
        onChange={(event) => model.setTitle(event.currentTarget.value)}
      />
      <span className={styles.faint}>{date}</span>
    </div>
  );
}

function Footer({ model, action }: { model: ReviewModel; action: ReactNode }) {
  const tutor = useLessonTutor(model.lesson, model.title);
  return (
    <ActionBar>
      <TutorNext tutor={tutor}>{action}</TutorNext>
    </ActionBar>
  );
}

export function ScanReview({ model, back, action }: ScanReviewProps) {
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
      <TitleField model={model} />
      <ReviewPages model={model} />
      {model.views ? <ReviewItems views={model.views} /> : null}
      <ReviewExercises questions={model.lesson.questions} />
    </Screen>
  );
}
