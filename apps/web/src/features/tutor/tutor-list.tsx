import { type ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-router';
import type { ScannedLesson } from '../../domain/scan-types.ts';
import { scanProgress } from '../../domain/services/index.ts';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { CameraIcon, ChevronIcon, NoteIcon, PenIcon, SignIcon } from '../../ui/icons.tsx';
import { JaRuns } from '../../ui/ja-runs.tsx';
import { paths } from '../../ui/paths.ts';
import { useServices } from '../../ui/services.tsx';
import { type Tutor, TutorMark } from '../../ui/tutor.tsx';
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
  /** A link to a screen, or else `onClick` (the tutor's sheet). */
  to?: string;
  onClick?: () => void;
  icon: ReactNode;
  title: string;
  detail: ReactNode;
  /** Shown muted with "Needs the tutor", and not a link, while the tutor is not set up. */
  off?: boolean;
  /** A quieter row: no tile behind its icon, its title not bold. */
  quiet?: boolean;
  /** No tile behind the icon, which draws its own (the 解 seal). */
  bare?: boolean;
}

function RowInner({ icon, title, detail, off = false, quiet = false, bare = false }: RowProps) {
  const t = useT();
  return (
    <>
      <span className={cx(styles.tile, (quiet || bare) && styles.quietTile)} aria-hidden="true">
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
}

function Row(props: RowProps) {
  const inner = <RowInner {...props} />;
  const row = cx(styles.row, props.quiet && styles.quiet);
  if (props.off) return <div className={cx(row, styles.off)}>{inner}</div>;
  if (props.to === undefined) {
    return (
      <button type="button" className={cx(row, styles.rowButton)} onClick={props.onClick}>
        {inner}
      </button>
    );
  }
  return (
    <Link to={props.to} className={row}>
      {inner}
    </Link>
  );
}

/** Scanned lessons and a sentence of your own: what comes from class, and needs the tutor. */
function ClassRows({ ready }: { ready: boolean }) {
  const t = useT();
  return (
    <>
      <Row
        to={paths.capture}
        icon={<CameraIcon />}
        title={t('tutor.capture')}
        detail={<ScanDetail ready={ready} />}
        off={!ready}
      />
      <Row
        to={paths.wild}
        icon={<SignIcon />}
        title={t('tutor.wild')}
        detail={t('tutor.wildDetail')}
        off={!ready}
      />
      <Row
        to={paths.compose}
        icon={<PenIcon />}
        title={t('tutor.compose')}
        detail={t(ready ? 'tutor.composeDetail' : 'tutor.composeOff')}
        off={!ready}
      />
    </>
  );
}

/**
 * The tab's one list: scanned lessons and a sentence of your own first, then asking the tutor
 * anything (its sheet, with suggested questions inside), then the week's words. What needs the
 * tutor is muted while it is not set up.
 */
export function TutorList({ ready, tutor }: { ready: boolean; tutor: Tutor | undefined }) {
  const t = useT();
  const off = !ready;
  return (
    <section className={styles.list} aria-label={t('tutor.listLabel')}>
      <ClassRows ready={ready} />
      <Row
        onClick={() => tutor?.open()}
        icon={<TutorMark />}
        title={t('tutor.askTitle')}
        detail={t('tutor.askDetail')}
        off={off || !tutor}
        bare
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
