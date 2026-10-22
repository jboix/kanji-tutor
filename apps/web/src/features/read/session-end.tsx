import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  finishLessonPart,
  type LessonSection,
  lessonNext,
  type MetFirst,
  metFirst,
  readingLabel,
  SECTION_TITLES,
  type SessionFocus,
  sessionSeconds,
} from '../../domain/services/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import { BottomNav } from '../../ui/bottom-nav.tsx';
import { cx } from '../../ui/cx.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { SECTION_NAME } from '../../ui/lesson-sections.ts';
import { paths } from '../../ui/paths.ts';
import { PillButton, PillLink } from '../../ui/pill-button.tsx';
import { Screen } from '../../ui/screen.tsx';
import { useServices } from '../../ui/services.tsx';
import styles from './read.module.css';
import { type AgainPlan, useAgain, useRetry } from './session-again.ts';
import end from './session-end.module.css';
import { LookAgain } from './session-end-missed.tsx';
import { Counts, DoneHeader, delay, NewToday } from './session-end-parts.tsx';
import {
  endCounts,
  type Missed,
  metInput,
  missedOf,
  retryCards,
  type SessionTally,
  sessionMinutes,
  splitMet,
} from './session-review.ts';
import type { Answered, DrillResult } from './session-state.ts';

export interface SessionEndProps {
  /** The session's cards, for the counts, the missed list and the retry round. */
  cards: SessionCard[];
  results: Answered[];
  drills?: DrillResult[];
  /** When the session was built; undefined for a session saved by older versions. */
  startedAt?: number | undefined;
  /** The unit practised, for a way back to it (T3). */
  unit?: string | undefined;
  /** The lesson part the session was (S3): it is marked done, and the next one offered. */
  lesson?: LessonPart | undefined;
  /** What "Next session" starts. */
  again: AgainPlan;
}

interface LessonPart {
  unit: string;
  section: LessonSection;
  part: number;
}

type Next = Awaited<ReturnType<typeof lessonNext>>;

/** The lesson part's next part, once it is known (`found` false while it is looked up). */
interface LessonNext {
  found: boolean;
  next: Next;
}

/** Marks the lesson part done once, then finds the part to go on with. */
function useLessonNext(lesson: LessonPart | undefined): LessonNext {
  const { repos } = useServices();
  const [state, setState] = useState<LessonNext>({ found: false, next: undefined });
  const unit = lesson?.unit;
  const section = lesson?.section;
  const part = lesson?.part ?? 1;
  useEffect(() => {
    if (!unit || !section) return;
    let live = true;
    void finishLessonPart(repos, unit, section, part, Date.now())
      .then(() => lessonNext(repos, unit))
      .then((next) => {
        if (live) setState({ found: true, next });
      });
    return () => {
      live = false;
    };
  }, [repos, unit, section, part]);
  return state;
}

/** "Next: 文法 · Grammar", to the lesson's next part. */
function NextPart({ unit, next }: { unit: string; next: NonNullable<Next> }) {
  const { t, rich } = useI18n();
  const section = <Ja>{SECTION_TITLES[next.section]}</Ja>;
  return (
    <PillLink to={paths.lessonPart(unit, next.section, next.part)} arrow>
      <span>{rich('read.nextSection', { section, name: t(SECTION_NAME[next.section]) })}</span>
    </PillLink>
  );
}

/** "Next session": a fresh round of the same kind. */
function NextSession({ plan }: { plan: AgainPlan }) {
  const t = useT();
  const { again, busy } = useAgain(plan);
  return (
    <PillButton disabled={busy} onClick={() => void again()}>
      {t('sessionEnd.nextSession')}
    </PillButton>
  );
}

/**
 * The session's main action: the lesson's next part when there is one, else another round.
 * A lesson part offers nothing until its next part is known, so the button does not swap.
 */
function MainAction({ unit, lesson, again }: Pick<SessionEndProps, 'unit' | 'lesson' | 'again'>) {
  const { found, next } = useLessonNext(lesson);
  if (lesson && !found) return null;
  if (unit && next) return <NextPart unit={unit} next={next} />;
  return <NextSession plan={again} />;
}

/** The retry arrow (W-end), drawn here so the shared icon set stays as it is. */
const RetryIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
  </svg>
);

/** "Retry 4 missed": a short round of only the missed cards, right away. */
function RetryButton({ missed }: { missed: readonly Missed[] }) {
  const t = useT();
  const cards = useMemo(() => retryCards(missed), [missed]);
  const retry = useRetry(cards);
  if (cards.length === 0) return null;
  return (
    <PillButton variant="secondary" onClick={retry}>
      <RetryIcon />
      {t('sessionEnd.retry', { n: missed.length })}
    </PillButton>
  );
}

interface ActionsProps extends Pick<SessionEndProps, 'unit' | 'lesson' | 'again'> {
  missed: readonly Missed[];
  at: number;
}

/** Retry (outlined) and the main action (filled), above the bottom bar's raised Start disc. */
function EndActions({ missed, at, ...main }: ActionsProps) {
  return (
    <div className={cx(end.actions, end.rise, main.lesson && end.stack)} style={delay(at)}>
      {missed.length > 0 && <RetryButton missed={missed} />}
      <MainAction {...main} />
    </div>
  );
}

/** What the session met first; undefined while it is looked up. */
function useMet(tally: SessionTally, startedAt: number | undefined) {
  const { repos } = useServices();
  const [met, setMet] = useState<MetFirst[]>();
  const input = useMemo(
    () => (startedAt === undefined ? undefined : metInput(tally, startedAt)),
    [tally, startedAt],
  );
  useEffect(() => {
    if (!input) return;
    let live = true;
    void metFirst(repos, input).then((found) => live && setMet(found));
    return () => {
      live = false;
    };
  }, [repos, input]);
  return input ? met : [];
}

/**
 * When each part rises in (W-end): a later part comes sooner when one before it is not shown.
 * The actions come right after the counts, not after the lists.
 */
function timeline(newShown: boolean) {
  const again = 1.35 + (newShown ? 0.85 : 0);
  return { news: 1.35, again, actions: 1.3 };
}

/**
 * End of a session (W-end, C-end): the check, お疲れさまでした, three plain counts,
 * what was new, what to look at again, then Retry and the next session. No praise, no score (no
 * gamification); Today is one tap away in the bottom bar.
 */
export function SessionEnd(props: SessionEndProps) {
  const { cards, results, drills = [], startedAt, unit, lesson, again } = props;
  const tally = useMemo(() => ({ cards, results, drills }), [cards, results, drills]);
  const missed = useMemo(() => missedOf(tally), [tally]);
  const met = useMet(tally, startedAt);
  const [minutes] = useState(() => sessionMinutes(startedAt, Date.now(), sessionSeconds(cards)));
  const sentences = cards.filter((card) => card.reason !== 'drill').length;
  const { shown, rest } = splitMet(met ?? []);
  const at = timeline(shown.length > 0);
  const actions = { missed, unit, lesson, again, at: at.actions };
  return (
    <Screen footer={<EndFooter {...actions} />} gap={22}>
      <DoneHeader minutes={minutes} />
      <Counts counts={endCounts(sentences, tally)} />
      {met && <NewToday shown={shown} rest={rest} at={at.news} />}
      {met && <LookAgain missed={missed} at={at.again} />}
      {unit && <BackToUnit unit={unit} />}
    </Screen>
  );
}

/** A unit practice keeps its way back to the unit (T3), under the lists. */
function BackToUnit({ unit }: { unit: string }) {
  const t = useT();
  return (
    <PillLink to={paths.unit(unit)} variant="secondary">
      {t('read.backToUnit')}
    </PillLink>
  );
}

function EndFooter(props: ActionsProps) {
  return (
    <>
      <EndActions {...props} />
      <BottomNav install={false} />
    </>
  );
}

function EmptyText({ focus }: { focus: SessionFocus | undefined }) {
  const { t, rich } = useI18n();
  if (focus) {
    return (
      <p className={styles.text}>
        {rich('read.noFocusSentence', {
          kanji: <Ja>{focus.kanji}</Ja>,
          reading: <Ja>{readingLabel(focus.reading)}</Ja>,
        })}
      </p>
    );
  }
  return (
    <p className={styles.text}>
      {rich('read.nothingToRead', {
        link: <Link to={paths.knownImport}>{t('read.markKnownWords')}</Link>,
      })}
    </p>
  );
}

/** While the session is built, or when no sentence fits. */
export function EmptySession(props: { loading?: boolean; focus?: SessionFocus | undefined }) {
  const t = useT();
  return (
    <Screen footer={<BottomNav install={false} />}>
      <h1 className={styles.title}>{t('read.title')}</h1>
      {props.loading ? (
        <p className={styles.muted}>{t('read.choosing')}</p>
      ) : (
        <>
          <EmptyText focus={props.focus} />
          <PillLink to={paths.today} variant="secondary">
            {t('read.backToToday')}
          </PillLink>
        </>
      )}
    </Screen>
  );
}
