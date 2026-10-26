import { type ContentLookup, localUnit } from '../../domain/content-language.ts';
import type { LearnerCoverage, LevelCoverage } from '../../domain/learner-view.ts';
import {
  levelUnits,
  type UnitPath,
  type UnitView,
  unitPractised,
} from '../../domain/services/index.ts';
import type { LearnerLevel } from '../../domain/types.ts';
import { BackButton } from '../../ui/back-button.tsx';
import { EnMark } from '../../ui/en-mark.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { ChevronIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { LessonCard } from '../../ui/lesson-card.tsx';
import { Loader } from '../../ui/loader.tsx';
import { paths } from '../../ui/paths.ts';
import { ProgressLine } from '../../ui/progress-line.tsx';
import { Screen } from '../../ui/screen.tsx';
import { SectionHeader } from '../../ui/section-label.tsx';
import { TopBar } from '../../ui/top-bar.tsx';
import { useContentLanguage } from '../../ui/use-content-language.ts';
import styles from './units.module.css';
import { cardAside, holdsLine, levelLine } from './units-copy.ts';
import { useCoverage, useUnitPath } from './use-units.ts';

const LEVELS: readonly LearnerLevel[] = [5, 4, 3];

/** One unit on the path as a lesson card: its title, where it is, what it holds, its progress. */
function UnitCard({ view, lookup }: { view: UnitView; lookup: ContentLookup }) {
  const t = useT();
  const { value: unit, english } = localUnit(lookup, view.unit);
  const meta = (
    <>
      <span className={styles.theme}>{unit.theme}</span>
      <EnMark english={english} /> · {holdsLine(t, view)}
    </>
  );
  return (
    <div className={styles.unitCard} data-unit={unit.id} data-state={view.state}>
      <LessonCard
        to={paths.unit(unit.id)}
        title={<Ja>{unit.titleJa}</Ja>}
        aside={cardAside(t, view)}
        meta={meta}
        progress={unitPractised(view)}
      />
    </div>
  );
}

function KnownCell({ label, row }: { label: string; row: LevelCoverage | undefined }) {
  const t = useT();
  if (!row || row.total === 0) return null;
  const count = t('units.ofTotal', { done: row.known, total: row.total });
  return (
    <div className={styles.knownCell}>
      <span className={styles.knownHead}>
        <span>{label}</span>
        <span className={styles.knownCount}>{count}</span>
      </span>
      <ProgressLine thin value={row.known / row.total} label={`${label}: ${count}`} />
    </div>
  );
}

/** A level's words, kanji and grammar known (T4, T7): plain counts at the top of its group. */
function LevelKnown({ coverage, level }: { coverage: LearnerCoverage; level: LearnerLevel }) {
  const t = useT();
  const at = (rows: readonly LevelCoverage[]) => rows.find((row) => row.level === level);
  return (
    <section className={styles.known} aria-label={t('units.levelKnown', { level })}>
      <KnownCell label={t('units.coverageWords')} row={at(coverage.words)} />
      <KnownCell label={t('units.coverageKanji')} row={at(coverage.kanji)} />
      <KnownCell label={t('units.coverageGrammar')} row={at(coverage.grammar)} />
    </section>
  );
}

interface LevelProps {
  level: LearnerLevel;
  path: UnitPath;
  coverage: LearnerCoverage | undefined;
}

/** One level's group: its counts first, then its units. Only the learner's level starts open. */
function LevelUnits({ level, path, coverage }: LevelProps) {
  const t = useT();
  const lookup = useContentLanguage();
  const views = path.units.filter((view) => view.unit.level === level);
  const own = level === path.level;
  const title = own ? t('units.yourLevel', { level }) : t('units.levelTitle', { level });
  const meta = levelLine(t, levelUnits(path.units, level));
  return (
    <section className={styles.level} aria-label={t('units.levelUnits', { level })}>
      <details className={styles.fold} open={own}>
        <summary className={styles.summary}>
          <SectionHeader title={title} meta={meta} />
          <span className={styles.foldIcon} aria-hidden="true">
            <ChevronIcon />
          </span>
        </summary>
        <div className={styles.cards}>
          {coverage && <LevelKnown coverage={coverage} level={level} />}
          {views.map((view) => (
            <UnitCard key={view.unit.id} view={view} lookup={lookup} />
          ))}
        </div>
      </details>
    </section>
  );
}

/** The lesson path, each level with what is known of it (T4, T7), at /units. */
export function UnitsScreen() {
  const t = useT();
  const path = useUnitPath();
  const coverage = useCoverage();
  const back = <BackButton parent={paths.learn} label={t('units.back')} />;
  return (
    <Screen topBar={<TopBar start={back} title={t('units.title')} />}>
      <p className={styles.intro}>{t('units.intro')}</p>
      {path ? (
        LEVELS.map((level) => (
          <LevelUnits key={level} level={level} path={path} coverage={coverage} />
        ))
      ) : (
        <Loader />
      )}
    </Screen>
  );
}
