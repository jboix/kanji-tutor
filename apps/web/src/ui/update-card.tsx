/**
 * A new version, offered on Home and in Settings → About (N1e): which one, what it brings, and
 * Update now. On Home, Later (or ✕) hides it until a newer version comes; Settings keeps it.
 * Updating says so, then the page reloads by itself.
 */
import { useState } from 'react';
import {
  type AppUpdate,
  applyUpdate,
  BUILD,
  dismissUpdate,
  type NewVersion,
  useAppUpdate,
  useUpdateDismissed,
} from './app-update.ts';
import { useT } from './i18n/i18n.tsx';
import { CloseIcon, DownloadIcon } from './icons.tsx';
import { PillButton } from './pill-button.tsx';
import styles from './update-card.module.css';

type Place = 'home' | 'settings';

function Heading({ title, line }: { title: string; line: string }) {
  return (
    <span className={styles.lines}>
      <span className={styles.title}>{title}</span>
      <span className={styles.line}>{line}</span>
    </span>
  );
}

function Mark() {
  return (
    <span className={styles.mark}>
      <DownloadIcon />
    </span>
  );
}

function Updating({ next }: { next: NewVersion }) {
  const t = useT();
  const title = next.version
    ? t('ui.updatingVersion', { version: next.version })
    : t('ui.updating');
  return (
    <>
      <div className={styles.top}>
        <Mark />
        <Heading title={title} line={t('ui.updatingLine')} />
      </div>
      <span className={styles.working} aria-hidden="true" />
    </>
  );
}

/** Lines on the card before "more". */
const SHOWN = 3;

/** What the version brings: three lines, and the rest behind "N more" (and back with "Less"). */
function Notes({ notes }: { notes: readonly string[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  if (notes.length === 0) return null;
  const rest = notes.length - SHOWN;
  const shown = open || rest <= 0 ? notes : notes.slice(0, SHOWN);
  return (
    <>
      <ul className={styles.notes}>
        {shown.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
      {rest > 0 && (
        <button
          type="button"
          className={styles.more}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? t('ui.updateLess') : t('ui.updateMore', { n: rest })}
        </button>
      )}
    </>
  );
}

function HomeOffer({ next }: { next: NewVersion }) {
  const t = useT();
  const line = next.version
    ? t('ui.updateVersions', { next: next.version, current: BUILD.version })
    : t('ui.updateCurrent', { current: BUILD.version });
  return (
    <>
      <div className={styles.top}>
        <Mark />
        <Heading title={t('ui.updateReady')} line={line} />
        <button
          type="button"
          className={styles.close}
          aria-label={t('ui.updateHide')}
          onClick={() => dismissUpdate(next)}
        >
          <CloseIcon />
        </button>
      </div>
      <Notes notes={next.notes} />
      <p className={styles.line}>{t('ui.updateHint')}</p>
      <div className={styles.actions}>
        <PillButton variant="secondary" grow={1} onClick={() => dismissUpdate(next)}>
          {t('ui.updateLater')}
        </PillButton>
        <PillButton grow={1.4} onClick={() => void applyUpdate()}>
          {t('ui.updateNow')}
        </PillButton>
      </div>
    </>
  );
}

function SettingsOffer({ next }: { next: NewVersion }) {
  const t = useT();
  const title = next.version
    ? t('ui.updateReadyVersion', { version: next.version })
    : t('ui.updateReady');
  return (
    <>
      <div className={styles.top}>
        <Mark />
        <Heading title={title} line={t('ui.updateNextOpen')} />
      </div>
      <PillButton block onClick={() => void applyUpdate()}>
        {t('ui.updateNow')}
      </PillButton>
    </>
  );
}

function Body({ update, place }: { update: Exclude<AppUpdate, { status: 'none' }>; place: Place }) {
  if (update.status === 'updating') return <Updating next={update.next} />;
  return place === 'home' ? <HomeOffer next={update.next} /> : <SettingsOffer next={update.next} />;
}

/** The new version on offer, or nothing; on Home, nothing once put off with Later. */
export function UpdateCard({ place }: { place: Place }) {
  const t = useT();
  const update = useAppUpdate();
  const next = update.status === 'none' ? undefined : update.next;
  const putOff = useUpdateDismissed(next);
  if (update.status === 'none') return null;
  if (place === 'home' && putOff && update.status === 'ready') return null;
  return (
    <section className={styles.card} aria-label={t('ui.updateLabel')} aria-live="polite">
      <Body update={update} place={place} />
    </section>
  );
}
