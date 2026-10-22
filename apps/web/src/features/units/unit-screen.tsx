import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { localGrammar, localUnit } from '../../domain/content-language.ts';
import {
  LESSON_SECTIONS,
  type LessonSection,
  markUnitDone,
  nextPart,
  SECTION_TITLES,
  type SectionProgress,
  sectionDone,
  type UnitView,
  unitShare,
} from '../../domain/services/index.ts';
import { unitGrammar } from '../../domain/themes/index.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey, Translate } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { SECTION_NAME } from '../../ui/lesson-sections.ts';
import { ListRow } from '../../ui/list-row.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { ProgressLine } from '../../ui/progress-line.tsx';
import { Screen } from '../../ui/screen.tsx';
import { SectionHeader } from '../../ui/section-label.tsx';
import { useServices } from '../../ui/services.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import { TapText } from '../../ui/word-tap.tsx';
import { UnitRead } from './unit-read.tsx';
import styles from './units.module.css';
import { progressLine, stateLine } from './units-copy.ts';
import { useUnit } from './use-units.ts';

type Mode = 'overview' | 'read';

const DETAIL: Readonly<Record<LessonSection, PlainKey>> = {
  words: 'units.detailWords',
  grammar: 'units.detailGrammar',
  practice: 'units.detailPractice',
  reading: 'units.detailReading',
  review: 'units.detailReview',
};

/** "Part 1 of 2 done", "Done", or what the section holds when it is not started. */
function sectionDetail(t: Translate, section: LessonSection, progress?: SectionProgress) {
  if (sectionDone(progress)) return t('units.sectionDone');
  if (progress && progress.done > 0) {
    return t('units.sectionParts', { done: progress.done, parts: progress.parts });
  }
  return t(DETAIL[section]);
}

interface SectionRowProps {
  view: UnitView;
  section: LessonSection;
  n: number;
  onMode: (mode: Mode) => void;
}

/** One section of the lesson (S3): its Japanese title and name, and where it is. */
function SectionRow({ view, section, n, onMode }: SectionRowProps) {
  const { t, rich } = useI18n();
  const title = <Ja>{SECTION_TITLES[section]}</Ja>;
  const navigate = useNavigate();
  const progress = view.progress.sections?.[section];
  const open = () => {
    if (section === 'reading') onMode('read');
    else void navigate(paths.lessonPart(view.unit.id, section, nextPart(progress)));
  };
  return (
    <div
      className={styles.step}
      data-section={section}
      aria-current={view.step === section ? 'step' : undefined}
    >
      <ListRow onClick={open} detail={sectionDetail(t, section, progress)}>
        {rich('units.sectionRow', { n, title, name: t(SECTION_NAME[section]) })}
      </ListRow>
    </div>
  );
}

/** The lesson's sections in textbook order (S3); without the unit in the packs, 読み物 only. */
function Sections({ view, onMode }: { view: UnitView; onMode: (mode: Mode) => void }) {
  const t = useT();
  const shown = view.pack ? LESSON_SECTIONS : (['reading'] as const);
  return (
    <section className={styles.section} aria-label={t('units.steps')}>
      <SectionHeader title={t('units.steps')} meta={stateLine(t, view)} />
      {shown.map((section) => (
        <SectionRow
          key={section}
          view={view}
          section={section}
          n={LESSON_SECTIONS.indexOf(section) + 1}
          onMode={onMode}
        />
      ))}
    </section>
  );
}

/** The unit's own progress, as on its row of the path (T7). */
function Progress({ view }: { view: UnitView }) {
  const t = useT();
  const line = progressLine(t, view);
  return (
    <div className={styles.rowDetail}>
      <p className={styles.muted}>{line}</p>
      <ProgressLine value={unitShare(view)} label={t('units.unitProgress', { line })} />
    </div>
  );
}

function Contents({ view }: { view: UnitView }) {
  const t = useT();
  const lookup = useContentLanguage();
  return (
    <section className={styles.section} aria-label={t('units.contents')}>
      <SectionHeader title={t('units.contents')} />
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

interface OverviewProps {
  view: UnitView;
  /** The unit's texts are in English: none in the learner's language (N9). */
  english: boolean;
  onMode: (mode: Mode) => void;
  onChange: () => void;
}

function Overview(props: OverviewProps) {
  const t = useT();
  const { view } = props;
  const { unit } = view;
  return (
    <>
      <header className={styles.section}>
        <p className={styles.muted}>
          {t('units.unitOrder', { level: unit.level, order: unit.order })}
        </p>
        <h1 lang="ja" className={styles.titleJa}>
          {unit.titleJa}
        </h1>
        <p className={styles.text}>
          {unit.theme}
          <EnMark english={props.english} />
        </p>
        <p className={styles.muted}>{unit.summary}</p>
        <Progress view={view} />
      </header>
      <Sections view={view} onMode={props.onMode} />
      <ReviewActions view={view} onChange={props.onChange} />
      <Contents view={view} />
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

/** One thematic unit (T3): its theme, counts and steps, at /units/:id. */
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
      {view === undefined && <p className={styles.muted}>{t('units.loadingUnit')}</p>}
      {view === null && <p className={styles.text}>{t('units.noUnit')}</p>}
      {view && <Body view={view} mode={mode} setMode={setMode} reload={reload} />}
    </Screen>
  );
}
