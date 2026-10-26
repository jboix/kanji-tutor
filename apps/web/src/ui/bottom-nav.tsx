import { type CSSProperties, type ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { TabSeal } from './ai-seal.tsx';
import { useAppUpdate, useUpdateDismissed } from './app-update.ts';
import styles from './bottom-nav.module.css';
import { cx } from './cx.ts';
import { useT } from './i18n/i18n.tsx';
import type { PlainKey } from './i18n/types.ts';
import { BookIcon, HomeIcon, PlayIcon, SettingsIcon } from './icons.tsx';
import { InstallBanner } from './install-banner.tsx';
import { paths } from './paths.ts';
import { StartSheet } from './start-sheet.tsx';
import { useTutorSetup } from './use-tutor-setup.ts';

interface Tab {
  to: string;
  label: PlainKey;
  icon: ReactNode;
  /** Paths whose screens belong to this tab (its hub and the hub's sub-screens). */
  owns: readonly string[];
  /** Its column in the bar's five; Start is column 2. */
  column: number;
}

/** The Tutor tab's column: its pill takes the Ask button's ground. */
const TUTOR_COLUMN = 3;

const LEARN_PATHS = [
  paths.learn,
  paths.units,
  paths.kanji,
  paths.grammarIndex,
  paths.learned,
  paths.notes,
  paths.handwrite,
];

const TABS_START: Tab[] = [
  {
    to: paths.today,
    label: 'ui.navToday',
    icon: <HomeIcon size={24} />,
    owns: [paths.today, paths.plan],
    column: 0,
  },
  // A real icon rather than 学, which a beginner may not read yet.
  {
    to: paths.learn,
    label: 'ui.navLearn',
    icon: <BookIcon size={24} />,
    owns: LEARN_PATHS,
    column: 1,
  },
];

const TABS_END: Tab[] = [
  {
    to: paths.tutor,
    label: 'ui.navTutor',
    // Drawn by TabLink: the seal shows whether the tab is active and the tutor set up.
    icon: null,
    owns: [paths.tutor, paths.capture, paths.compose, paths.knownImport],
    column: TUTOR_COLUMN,
  },
  {
    to: paths.settings,
    label: 'ui.navSettings',
    icon: <SettingsIcon size={24} />,
    owns: [paths.settings],
    column: 4,
  },
];

function owns(tab: Tab, pathname: string): boolean {
  return tab.owns.some((path) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`),
  );
}

/** The column of the tab that owns `pathname`, or undefined (Start, a session's end). */
export function activeColumn(pathname: string): number | undefined {
  return [...TABS_START, ...TABS_END].find((tab) => owns(tab, pathname))?.column;
}

/** True when a new version waits that Home no longer offers: Settings → About still does. */
function useUpdateWaiting(): boolean {
  const update = useAppUpdate();
  const next = update.status === 'ready' ? update.next : undefined;
  return useUpdateDismissed(next);
}

/** The dot and the accessible name of a tab that waits on something: an update, the tutor. */
function useTabNotice(tab: Tab): string | undefined {
  const t = useT();
  const update = useUpdateWaiting() && tab.to === paths.settings;
  const setup = useTutorSetup();
  if (update) return t('ui.navSettingsUpdate');
  if (tab.to === paths.tutor && setup?.ready === false) return t('ui.navTutorUnset');
  return undefined;
}

function TabLink({ tab, active }: { tab: Tab; active: boolean }) {
  const t = useT();
  const notice = useTabNotice(tab);
  const unset = tab.to === paths.tutor && notice !== undefined;
  const icon = tab.to === paths.tutor ? <TabSeal active={active} unset={unset} /> : tab.icon;
  return (
    <Link
      to={tab.to}
      className={cx(styles.link, active && styles.active)}
      aria-current={active ? 'page' : undefined}
      aria-label={notice}
      data-tutor-tab={tab.to === paths.tutor ? '' : undefined}
    >
      {notice && <span className={styles.dot} aria-hidden="true" />}
      <span className={styles.icon}>{icon}</span>
      <span className={styles.label}>{t(tab.label)}</span>
    </Link>
  );
}

/** The raised Start disc (IA3): it opens the sheet of rounds to start. */
function StartButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={styles.start}
        aria-label={t('ui.navStartLabel')}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className={styles.disc}>
          <PlayIcon />
        </span>
        <span aria-hidden="true">{t('ui.navStart')}</span>
      </button>
      <StartSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Where the highlight was on the last screen: each screen mounts its own bar. */
let lastColumn: number | undefined;

/**
 * The highlight's column. A new screen's bar starts it where the last one left it, then
 * moves it to the active tab once the old place is styled, so the move is a CSS transition.
 */
function useIndicator(column: number | undefined) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(() => lastColumn ?? column);
  useLayoutEffect(() => {
    lastColumn = column;
    if (shown === column) return;
    ref.current?.getBoundingClientRect();
    setShown(column);
  }, [column, shown]);
  return { ref, shown };
}

/**
 * The tonal pill behind the active tab's icon; it slides between tabs and hides on Start. Under
 * the Tutor tab it turns to the Ask ground.
 */
function Indicator({ column }: { column: number | undefined }) {
  const { ref, shown } = useIndicator(column);
  return (
    <span
      ref={ref}
      className={styles.indicator}
      data-nav-indicator=""
      data-hidden={shown === undefined ? '' : undefined}
      data-ask={shown === TUTOR_COLUMN ? '' : undefined}
      style={{ '--column': shown ?? 0 } as CSSProperties}
      aria-hidden="true"
    />
  );
}

/**
 * The bottom bar (IA3): Today · Learn · Start · Tutor · Settings. The hubs carry it, so it also
 * carries the install banner (N1d), unless `install` is false (Settings, a session's end).
 */
export function BottomNav({ install = true }: { install?: boolean }) {
  const t = useT();
  const column = activeColumn(useLocation().pathname);
  const link = (tab: Tab) => <TabLink key={tab.to} tab={tab} active={tab.column === column} />;
  return (
    <>
      {install && (
        <div className={styles.bannerSlot}>
          <InstallBanner />
        </div>
      )}
      <nav className={styles.nav} aria-label={t('ui.navMain')} data-bottom-nav="">
        <Indicator column={column} />
        {TABS_START.map(link)}
        <StartButton />
        {TABS_END.map(link)}
      </nav>
    </>
  );
}

/** Test helper: forgets the last screen's highlight, as on a fresh page load. */
export function resetIndicator(): void {
  lastColumn = undefined;
}
