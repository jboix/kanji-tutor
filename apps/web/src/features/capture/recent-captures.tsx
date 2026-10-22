import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { Repos } from '../../domain/repos.ts';
import { type Readiness, readiness } from '../../domain/services/index.ts';
import type { Capture } from '../../domain/types.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { ChevronIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { SectionHeader } from '../../ui/section-label.tsx';
import { useServices } from '../../ui/services.tsx';
import styles from './capture.module.css';
import { captureLine, percent } from './capture-copy.ts';
import { captureHref } from './use-capture-start.ts';

const RECENT = 10;

interface Recent {
  capture: Capture;
  readiness: Readiness;
}

async function loadRecent(repos: Repos): Promise<Recent[]> {
  const captures = await repos.captures.recent(RECENT);
  const items = await repos.items.byKind('word');
  const levels = new Map(items.map((item) => [item.ref, item.level]));
  return Promise.all(
    captures.map(async (capture) => {
      const sentences = await repos.sentences.getMany(capture.sentenceIds);
      const tokens = sentences.flatMap((sentence) => sentence?.tokens ?? []);
      return { capture, readiness: readiness(tokens, levels) };
    }),
  );
}

function useRecent(): Recent[] | undefined {
  const { repos } = useServices();
  const [recent, setRecent] = useState<Recent[]>();
  useEffect(() => {
    let live = true;
    void loadRecent(repos).then((rows) => {
      if (live) setRecent(rows);
    });
    return () => {
      live = false;
    };
  }, [repos]);
  return recent;
}

/** The stored photo as an object URL, revoked when the row unmounts. */
function Thumb({ photo }: { photo: Blob | undefined }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!photo || typeof URL.createObjectURL !== 'function') return;
    const next = URL.createObjectURL(photo);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [photo]);
  if (!url) {
    return (
      <span className={styles.thumb} aria-hidden="true">
        <Ja>文</Ja>
      </span>
    );
  }
  return <img className={styles.thumb} src={url} alt="" />;
}

function RecentRow({ row, now }: { row: Recent; now: number }) {
  const { capture } = row;
  const { t, format } = useI18n();
  const share = t('capture.canReadShort', { percent: percent(row.readiness.ratio) });
  return (
    <Link to={captureHref(capture.id)} className={styles.recentRow}>
      <Thumb photo={capture.photo} />
      <span className={styles.recentMain}>
        <span lang="ja" className={styles.recentLine}>
          {capture.lines[0] ?? ''}
        </span>
        <span className={styles.recentDetail}>
          {captureLine(t, format, capture, now)} · {share}
        </span>
      </span>
      <span className={styles.chevron}>
        <ChevronIcon />
      </span>
    </Link>
  );
}

/** Saved captures, newest first; they open from storage, offline too (C5). */
export function RecentCaptures({ now }: { now: number }) {
  const recent = useRecent();
  const t = useT();
  if (!recent || recent.length === 0) return null;
  return (
    <section aria-label={t('capture.recent')}>
      <SectionHeader title={t('capture.recent')} />
      <div className={styles.recentList}>
        {recent.map((row) => (
          <RecentRow key={row.capture.id} row={row} now={now} />
        ))}
      </div>
    </section>
  );
}
