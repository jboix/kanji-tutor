import { useState } from 'react';
import { useLocation } from 'react-router';
import type { TodayOverview } from '../../domain/services/index.ts';
import { BackupReminder } from '../../ui/backup-reminder.tsx';
import { BottomNav } from '../../ui/bottom-nav.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { PillLink } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { PlacementRows } from './placement-row.tsx';
import styles from './today.module.css';
import { ClassSection } from './today-class.tsx';
import { dateLine } from './today-copy.ts';
import { LevelUpRow } from './today-lesson.tsx';
import { NextUp } from './today-next.tsx';
import { WeekPlanLine } from './today-plan.tsx';
import { Practice } from './today-practice.tsx';
import { Lead } from './today-sections.tsx';
import { WhereYouAre } from './today-where.tsx';
import { type TodayData, type TodaySessionView, useToday } from './use-today.ts';

/**
 * Today (IA2, R1), the one rich screen: where you are, what is next in the unit, what Start
 * plays, this week's plan, and the level rows. Start in the bottom bar begins the round (IA3).
 */
export function TodayScreen() {
  const [now, setNow] = useState(() => Date.now());
  const data = useToday(now);
  const reload = () => setNow(Date.now());
  return (
    <Screen footer={<BottomNav />} gap={28}>
      <TodayHeader now={now} />
      <BackupReminder />
      <Notice />
      <TodayContent data={data} now={now} onChange={reload} />
    </Screen>
  );
}

/** One quiet line handed over by another screen, e.g. "Saved to your sentences." */
function Notice() {
  const state: unknown = useLocation().state;
  const notice =
    typeof state === 'object' && state !== null && 'notice' in state ? String(state.notice) : '';
  if (!notice) return null;
  return (
    <p className={styles.muted} role="status">
      {notice}
    </p>
  );
}

function TodayHeader({ now }: { now: number }) {
  return (
    <header className={styles.header}>
      <h1 lang="ja" className={styles.title}>
        今日
      </h1>
      <span className={styles.date} lang="ja">
        {dateLine(now)}
      </span>
    </header>
  );
}

function Loading({ text }: { text: 'today.loading' | 'today.choosing' }) {
  const t = useT();
  return (
    <p className={styles.muted} role="status">
      {t(text)}
    </p>
  );
}

interface TodayContentProps {
  data: TodayData;
  now: number;
  onChange: () => void;
}

/**
 * The overview shows as soon as it is known and the session fills in (N10). A learner who
 * tracks nothing yet waits for the session, which decides between the first run and the body.
 */
function TodayContent({ data, now, onChange }: TodayContentProps) {
  const { overview, session } = data;
  const fromZero = overview?.trackedWords === 0;
  if (!overview || (fromZero && !session)) return <Loading text="today.loading" />;
  if (fromZero && session?.cards.length === 0) return <FirstRun overview={overview} now={now} />;
  return <TodayBody overview={overview} session={session} now={now} onChange={onChange} />;
}

/** "6 sentences … about 5 minutes. Press Start." once the session is built. */
function MixLine({ overview, session }: Omit<TodayBodyProps, 'now' | 'onChange'>) {
  const t = useT();
  if (!session) return <Loading text="today.choosing" />;
  return (
    <>
      <Lead summary={{ ...overview, ...session }} />
      {session.cards.length > 0 && <p className={styles.muted}>{t('today.pressStart')}</p>}
    </>
  );
}

interface TodayBodyProps {
  overview: TodayOverview;
  session: TodaySessionView | undefined;
  now: number;
  onChange: () => void;
}

function TodayBody({ overview, session, now, onChange }: TodayBodyProps) {
  const mix = <MixLine overview={overview} session={session} />;
  return (
    <>
      <WhereYouAre key={now} last={overview.lastTime} />
      {overview.unit && <NextUp unit={overview.unit} />}
      <Practice now={now} unit={overview.unit} mix={mix} handoff={session?.handoff} />
      <ClassSection summary={overview} />
      <WeekPlanLine now={now} />
      {overview.levelUp && <LevelUpRow levelUp={overview.levelUp} onChange={onChange} />}
      <div>
        {overview.trackedWords === 0 && <MarkRow />}
        <PlacementRows now={now} />
      </div>
    </>
  );
}

/** A learner who tracks nothing yet is still offered the import (P1). */
function MarkRow() {
  const t = useT();
  return (
    <ListRow to={paths.knownImport} detail={t('today.markDetail')}>
      {t('today.mark')}
    </ListRow>
  );
}

/** A brand-new learner: nothing is known yet, so no sentence is i+1. */
function FirstRun({ overview, now }: { overview: TodayOverview; now: number }) {
  const t = useT();
  return (
    <>
      {overview.unit && <NextUp unit={overview.unit} />}
      <section className={styles.lead} aria-labelledby="first-run">
        <h2 id="first-run" className={styles.firstTitle}>
          {t('today.mark')}
        </h2>
        <p className={styles.text}>{t('today.firstRun')}</p>
        <PillLink to={paths.knownImport} arrow>
          {t('today.mark')}
        </PillLink>
        <p className={styles.muted}>{t('today.firstRunStart')}</p>
        <div>
          <PlacementRows now={now} />
        </div>
      </section>
    </>
  );
}
