import { type ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { ScannedLesson } from '../../domain/scan-types.ts';
import { scanProgress } from '../../domain/services/index.ts';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { CameraIcon, ChevronIcon, NoteIcon, PenIcon } from '../../ui/icons.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { paths } from '../../ui/paths.ts';
import { useServices } from '../../ui/services.tsx';
import styles from './tutor.module.css';

/** The newest scanned lesson; null when there is none, undefined while it is read. */
function useLatestScan(): ScannedLesson | null | undefined {
  const { repos } = useServices();
  const [latest, setLatest] = useState<ScannedLesson | null>();
  useEffect(() => {
    let live = true;
    void repos.scans.recent(1).then(([newest]) => {
      if (live) setLatest(newest ?? null);
    });
    return () => {
      live = false;
    };
  }, [repos]);
  return latest;
}

/** "Weather and plans · 6 of 20 practised", or what scanning does before any lesson. */
function ScanDetail({ ready }: { ready: boolean }) {
  const t = useT();
  const latest = useLatestScan();
  if (!ready || !latest) return t('tutor.captureDetail');
  const { done, total } = scanProgress(latest);
  const started = Object.keys(latest.practised).length > 0;
  const progress = started ? t('ui.practisedOf', { done, total }) : t('ui.notStarted');
  return (
    <>
      <JaRuns text={latest.title} /> · {progress}
    </>
  );
}

interface RowProps {
  to: string;
  icon: ReactNode;
  title: string;
  detail: ReactNode;
  /** Shown muted with "Needs the tutor", and not a link, while the tutor is not set up. */
  off?: boolean;
  /** A quieter row: no tile behind its icon, its title not bold. */
  quiet?: boolean;
}

function Row({ to, icon, title, detail, off = false, quiet = false }: RowProps) {
  const t = useT();
  const inner = (
    <>
      <span className={cx(styles.tile, quiet && styles.quietTile)} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.text}>
        <span className={cx(styles.name, quiet && styles.quietName)}>{title}</span>
        <span className={styles.detail}>{detail}</span>
      </span>
      {off ? (
        <span className={styles.needs}>{t('tutor.needsTutor')}</span>
      ) : (
        <span className={styles.chevron} aria-hidden="true">
          <ChevronIcon />
        </span>
      )}
    </>
  );
  if (off) return <div className={cx(styles.row, styles.off)}>{inner}</div>;
  return (
    <Link to={to} className={styles.row}>
      {inner}
    </Link>
  );
}

/**
 * "From your class": scanned lessons and writing a sentence, which need the tutor, and the
 * week's words, which do not.
 */
export function ClassSection({ ready }: { ready: boolean }) {
  const t = useT();
  const off = !ready;
  return (
    <section className={styles.class} aria-labelledby="tutor-class">
      <h2 id="tutor-class" className={styles.classTitle}>
        {t('tutor.classTitle')}
      </h2>
      <Row
        to={paths.capture}
        icon={<CameraIcon />}
        title={t('tutor.capture')}
        detail={<ScanDetail ready={ready} />}
        off={off}
      />
      <Row
        to={paths.compose}
        icon={<PenIcon />}
        title={t('tutor.compose')}
        detail={t(ready ? 'tutor.composeDetail' : 'tutor.composeOff')}
        off={off}
      />
      <Row
        to={paths.knownImport}
        icon={<NoteIcon />}
        title={t('tutor.class')}
        detail={t('tutor.classDetail')}
        quiet
      />
    </section>
  );
}
