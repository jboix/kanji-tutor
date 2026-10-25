/**
 * One scanned lesson (scans/Lesson), like a unit's page: its title (renamed in place), when it
 * was scanned and its pages, each photo a tap from full size; its items practised with when it
 * was last practised; its parts; the pages' text, a line a tap from the tutor's explanation.
 * The footer holds the tutor beside "Practise this lesson", both in reach without scrolling.
 */
import { useId, useState } from 'react';
import type { ScannedLesson, ScanPage } from '../../domain/scan-types.ts';
import { scanPracticeMinutes, scanProgress } from '../../domain/services/index.ts';
import { ActionBar } from '../../ui/action-bar.tsx';
import { BackButton } from '../../ui/back-button.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { IconButton } from '../../ui/icon-button.tsx';
import { PenIcon } from '../../ui/icons.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { paths } from '../../ui/paths.ts';
import { PhotoSheet } from '../../ui/photo-sheet.tsx';
import { PillButton, PillLink } from '../../ui/pill-button.tsx';
import { PractisedProgress } from '../../ui/practised-progress.tsx';
import { Screen } from '../../ui/screen.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { TutorNext } from '../../ui/tutor.tsx';
import styles from './lesson.module.css';
import { LessonLines } from './lesson-lines.tsx';
import { LessonMenu } from './lesson-menu.tsx';
import { LessonParts } from './lesson-parts.tsx';
import { PageThumb } from './page-grid.tsx';
import { useLessonTutor } from './scan-tutor.ts';
import type { ReviewModel } from './use-draft-review.ts';

/** The title, or the field that renames the lesson. */
function Title(props: {
  model: ReviewModel;
  renaming: boolean;
  onRename: (on: boolean) => void;
  commit: () => void;
}) {
  const { model, renaming, onRename, commit } = props;
  const t = useT();
  const id = useId();
  if (!renaming) {
    return (
      <div className={styles.titleRow}>
        <h1 className={styles.title}>
          <JaRuns text={model.title} />
        </h1>
        <IconButton aria-label={t('capture.rename')} muted onClick={() => onRename(true)}>
          <PenIcon />
        </IconButton>
      </div>
    );
  }
  const done = () => {
    commit();
    onRename(false);
  };
  return (
    <form
      className={styles.rename}
      onSubmit={(event) => {
        event.preventDefault();
        done();
      }}
    >
      <label htmlFor={id} className={styles.muted}>
        {t('capture.renameLabel')}
      </label>
      <input
        id={id}
        className={styles.input}
        value={model.title}
        onChange={(e) => model.setTitle(e.currentTarget.value)}
      />
      <PillButton type="submit" variant="secondary">
        {t('capture.saveName')}
      </PillButton>
    </form>
  );
}

function Photo({ page, n }: { page: ScanPage; n: number }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const label = t('capture.seePhoto', { n });
  const text = page.lines.map((line) => line.text).join('\n');
  return (
    <>
      <button
        type="button"
        className={styles.photo}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        <PageThumb photo={page.photo} text={text} label="" />
      </button>
      {open && (
        <PhotoSheet
          photo={page.photo}
          text={text}
          label={t('capture.pageN', { n })}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function Progress({ lesson }: { lesson: ScannedLesson }) {
  const { t, format } = useI18n();
  const { done, total, lastPractisedAt } = scanProgress(lesson);
  if (total === 0) return null;
  const date = lastPractisedAt && format.date(lastPractisedAt, { day: 'numeric', month: 'short' });
  return (
    <PractisedProgress
      layout="stacked"
      done={done}
      total={total}
      aside={date ? t('capture.lastPractised', { date }) : undefined}
    />
  );
}

function Footer({ model }: { model: ReviewModel }) {
  const { t } = useI18n();
  const tutor = useLessonTutor(model.lesson, model.title);
  const { id } = model.lesson;
  const minutes = scanPracticeMinutes(model.lesson);
  const can = scanProgress(model.lesson).total > 0;
  return (
    <ActionBar>
      <TutorNext tutor={tutor}>
        {can && (
          <PillLink to={`${paths.read}?scan=${encodeURIComponent(id)}`} block>
            <span className={styles.pillText}>
              {t('capture.practise')}
              <span data-sub="">{t('capture.practiseSub', { n: minutes })}</span>
            </span>
          </PillLink>
        )}
      </TutorNext>
    </ActionBar>
  );
}

export interface LessonPageProps {
  model: ReviewModel;
  commitTitle: () => void;
}

export function LessonPage({ model, commitTitle }: LessonPageProps) {
  const { t, format } = useI18n();
  const [renaming, setRenaming] = useState(false);
  const { lesson } = model;
  const back = <BackButton parent={paths.capture} label={t('common.back')} />;
  const menu = <LessonMenu id={lesson.id} onRename={() => setRenaming(true)} />;
  const date = format.date(lesson.createdAt, { weekday: 'long', day: 'numeric', month: 'long' });
  const pages = t('capture.pages', { n: lesson.pages.length });
  return (
    <Screen
      topBar={<TopBar start={back} end={menu} />}
      footer={<Footer model={model} />}
      gap={22}
      top={8}
    >
      <header className={styles.header}>
        <Title model={model} renaming={renaming} onRename={setRenaming} commit={commitTitle} />
        <p className={styles.muted}>{t('capture.scannedMeta', { date, pages })}</p>
      </header>
      <div className={styles.photos}>
        {lesson.pages.map((page, i) => (
          <Photo key={page.lines[0]?.sentenceId ?? `page-${i}`} page={page} n={i + 1} />
        ))}
      </div>
      <Progress lesson={lesson} />
      <LessonParts lesson={lesson} views={model.views ?? []} />
      <LessonLines model={model} />
    </Screen>
  );
}
