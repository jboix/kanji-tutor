import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { localGrammar, localUnit } from '../../domain/content-language.ts';
import {
  lastPractised,
  markUnitDone,
  type UnitView,
  unitPractised,
} from '../../domain/services/index.ts';
import { unitGrammar } from '../../domain/themes/index.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { Loader } from '../../ui/loader.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { PractisedProgress } from '../../ui/practised-progress.tsx';
import { Screen } from '../../ui/screen.tsx';
import { SectionHeader } from '../../ui/section-label.tsx';
import { useServices } from '../../ui/services.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import { TapText } from '../../ui/word-tap.tsx';
import { UnitFooter } from './unit-footer.tsx';
import { type Mode, UnitParts } from './unit-parts.tsx';
import { UnitRead } from './unit-read.tsx';
import styles from './units.module.css';
import { holdsLine, progressLine } from './units-copy.ts';
import { useUnit } from './use-units.ts';

/** The unit's items practised, one line, with when it was last practised (T7). */
function Progress({ view }: { view: UnitView }) {
  const { t, format } = useI18n();
  const at = lastPractised(view);
  const date = at === undefined ? undefined : format.date(at, { day: 'numeric', month: 'short' });
  return (
    <div className={styles.progress}>
      <PractisedProgress
        layout="stacked"
        {...unitPractised(view)}
        aside={date && t('units.lastPractised', { date })}
      />
    </div>
  );
}

/** The unit's words and grammar, with how many are known beside the title, as detail. */
function Contents({ view }: { view: UnitView }) {
  const t = useT();
  const lookup = useContentLanguage();
  return (
    <section className={styles.contents} aria-label={t('units.contents')}>
      <SectionHeader title={t('units.contents')} meta={progressLine(t, view)} />
      <ul className={styles.words}>
        {view.unit.words.map((word) => (
          <li key={word.written}>
            <TapText text={word.written} id={`unit-word:${word.written}`} word />
            {word.reading !== word.written && (
              <span lang="ja" className={styles.reading}>
                {word.reading}
              </span>
            )}
          </li>
        ))}
      </ul>
      <ul className={styles.words}>
        {unitGrammar(view.unit).map((source) => {
          const { value: entry, english } = localGrammar(lookup, source);
          return (
            <li key={entry.id}>
              <Link to={paths.grammar(entry.id)} className={styles.link}>
                <Ja>{entry.pattern}</Ja>
              </Link>{' '}
              <span className={styles.muted}>{entry.meaning}</span>
              <EnMark english={english} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Mark done or skip, for a review unit below the learner's level (T3). */
function ReviewActions({ view, onChange }: { view: UnitView; onChange: () => void }) {
  const t = useT();
  const { repos } = useServices();
  if (!view.review || view.state === 'done') return null;
  const mark = (skip: boolean) =>
    void markUnitDone(repos, view.unit.id, Date.now(), skip).then(onChange);
  return (
    <div className={styles.actions}>
      <p className={styles.muted}>{t('units.belowLevel')}</p>
      <PillButton variant="secondary" onClick={() => mark(false)}>
        {t('units.markDone')}
      </PillButton>
      <PillButton variant="secondary" onClick={() => mark(true)}>
        {t('units.skipIt')}
      </PillButton>
    </div>
  );
}

/** The unit's title, what it holds and is about, and its summary (Lesson page). */
function Header({ view, english }: { view: UnitView; english: boolean }) {
  const t = useT();
  const { unit } = view;
  const order = t('units.unitOrder', { level: unit.level, order: unit.order });
  return (
    <header className={styles.header}>
      <div className={styles.titles}>
        <h1 lang="ja" className={styles.titleJa}>
          {unit.titleJa}
        </h1>
        <p className={styles.order}>{`${order} · ${holdsLine(t, view)}`}</p>
        <p className={styles.theme}>
          {unit.theme}
          <EnMark english={english} />
        </p>
      </div>
      <p className={styles.muted}>{unit.summary}</p>
    </header>
  );
}

interface OverviewProps {
  view: UnitView;
  /** The unit's texts are in English: none in the learner's language (N9). */
  english: boolean;
  onMode: (mode: Mode) => void;
  onChange: () => void;
}

function Overview({ view, english, onMode, onChange }: OverviewProps) {
  return (
    <>
      <Header view={view} english={english} />
      <div className={styles.partsCard}>
        <Progress view={view} />
        <UnitParts view={view} onMode={onMode} />
      </div>
      <ReviewActions view={view} onChange={onChange} />
      <Contents view={view} />
      <UnitFooter view={view} onMode={onMode} />
    </>
  );
}

function Body(props: {
  view: UnitView;
  mode: Mode;
  setMode: (m: Mode) => void;
  reload: () => void;
}) {
  const { mode, setMode, reload } = props;
  const local = localUnit(useContentLanguage(), props.view.unit);
  const view = { ...props.view, unit: local.value };
  if (mode === 'read') return <UnitRead view={view} />;
  return <Overview view={view} english={local.english} onMode={setMode} onChange={reload} />;
}

/** One thematic unit (T3) as a lesson page: its progress, its sections, the tutor, at /units/:id. */
export function UnitScreen() {
  const t = useT();
  const { id = '' } = useParams();
  const [now, setNow] = useState(() => Date.now());
  const [mode, setMode] = useState<Mode>('overview');
  const view = useUnit(id, now);
  const back = <BackButton parent={paths.units} label={t('units.back')} />;
  const reload = () => setNow(Date.now());
  return (
    <Screen topBar={<TopBar start={back} />} gap={22}>
      {view === undefined && <Loader />}
      {view === null && <p className={styles.text}>{t('units.noUnit')}</p>}
      {view && <Body view={view} mode={mode} setMode={setMode} reload={reload} />}
    </Screen>
  );
}
