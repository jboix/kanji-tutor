/**
 * Scanned lessons (scans/List): every handout scanned, newest first, as a lesson card with its
 * date, what it holds and its plain progress; and "New scan". What is learned here comes back
 * in the daily reviews, and the screen says so.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { ScannedLesson } from '../../domain/scan-types.ts';
import { scanProgress } from '../../domain/services/index.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { LessonCard } from '../../ui/lesson-card.tsx';
import { paths } from '../../ui/paths.ts';
import { Screen } from '../../ui/screen.tsx';
import { useServices } from '../../ui/services.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import styles from './capture.module.css';
import { KIND_LABELS } from './scan-copy.ts';

/** A saved scanned lesson's page. */
export function scanHref(id: string): string {
  return `${paths.capture}?id=${encodeURIComponent(id)}`;
}

/** The new scan screen. */
export const NEW_SCAN = `${paths.capture}?new=1`;

function useLessons(): ScannedLesson[] | undefined {
  const { repos } = useServices();
  const [lessons, setLessons] = useState<ScannedLesson[]>();
  useEffect(() => {
    let live = true;
    void repos.scans.all().then((rows) => {
      if (live) setLessons(rows.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => {
      live = false;
    };
  }, [repos]);
  return lessons;
}

const META_KEYS = {
  kanji: 'capture.metaKanji',
  word: 'capture.metaWords',
  grammar: 'capture.metaGrammar',
  questions: 'capture.metaExercises',
} as const;

/** "3 pages · Kanji, grammar, exercises"; a lesson with nothing matched names its first page. */
export function lessonMeta(t: Translate, lesson: ScannedLesson): string {
  const kinds = [...new Set(scanProgress(lesson).parts.map((part) => t(META_KEYS[part.kind])))];
  const first = lesson.pages[0];
  const named = kinds.join(', ') || (first ? t(KIND_LABELS[first.kind]) : '');
  const capitalised = named.charAt(0).toLocaleUpperCase() + named.slice(1);
  return t('capture.metaLine', {
    pages: t('capture.pages', { n: lesson.pages.length }),
    kinds: capitalised,
  });
}

function Card({ lesson }: { lesson: ScannedLesson }) {
  const { t, format } = useI18n();
  const { done, total } = scanProgress(lesson);
  const date = format.date(lesson.createdAt, { day: 'numeric', month: 'short' });
  return (
    <LessonCard
      to={scanHref(lesson.id)}
      title={<JaRuns text={lesson.title} />}
      aside={date}
      meta={lessonMeta(t, lesson)}
      progress={{ done, total, started: Object.keys(lesson.practised).length > 0 }}
    />
  );
}

export function ScanList() {
  const t = useT();
  const lessons = useLessons();
  const back = <BackButton parent={paths.tutor} label={t('common.back')} />;
  const add = (
    <Link to={NEW_SCAN} className={styles.newScan}>
      {t('capture.newScan')}
    </Link>
  );
  return (
    <Screen topBar={<TopBar start={back} />} gap={18} top={4}>
      <header className={styles.listHead}>
        <h1 className={styles.listTitle}>{t('capture.listTitle')}</h1>
        {add}
      </header>
      <p className={styles.lead}>{t('capture.listLead')}</p>
      {lessons?.length === 0 && <p className={styles.muted}>{t('capture.listEmpty')}</p>}
      <div className={styles.cards}>
        {lessons?.map((lesson) => (
          <Card key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </Screen>
  );
}
