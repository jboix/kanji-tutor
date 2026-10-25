/** The latest scanned lessons under the import screen; each opens from storage, offline too. */
import { useEffect, useState } from 'react';
import type { ScannedLesson } from '../../domain/scan-types.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { SectionHeader } from '../../ui/section-label.tsx';
import { useServices } from '../../ui/services.tsx';

/** Lessons listed, at most. */
const RECENT = 5;

/** A saved scanned lesson's page. */
export function scanHref(id: string): string {
  return `${paths.capture}?id=${encodeURIComponent(id)}`;
}

function useRecent(): ScannedLesson[] | undefined {
  const { repos } = useServices();
  const [recent, setRecent] = useState<ScannedLesson[]>();
  useEffect(() => {
    let live = true;
    void repos.scans.recent(RECENT).then((rows) => live && setRecent(rows));
    return () => {
      live = false;
    };
  }, [repos]);
  return recent;
}

function Row({ lesson }: { lesson: ScannedLesson }) {
  const { t, format } = useI18n();
  const date = format.date(lesson.createdAt, { day: 'numeric', month: 'short' });
  const pages = t('capture.pages', { n: lesson.pages.length });
  return (
    <ListRow to={scanHref(lesson.id)} detail={t('capture.recentDetail', { date, pages })}>
      <JaRuns text={lesson.title} />
    </ListRow>
  );
}

/** "Your scanned lessons", newest first. */
export function RecentScans() {
  const recent = useRecent();
  const t = useT();
  if (!recent || recent.length === 0) return null;
  return (
    <section aria-label={t('capture.recent')}>
      <SectionHeader title={t('capture.recent')} />
      {recent.map((lesson) => (
        <Row key={lesson.id} lesson={lesson} />
      ))}
    </section>
  );
}
