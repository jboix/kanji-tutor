/** "Next up" on Today (IA2): the current unit, its five sections and where the learner is. */
import { Link } from 'react-router';
import {
  LESSON_SECTIONS,
  type LessonSection,
  nextPart,
  SECTION_TITLES,
  sectionDone,
  type UnitView,
} from '../../domain/services/index.ts';
import { cx } from '../../ui/cx.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PlayIcon } from '../../ui/icons.tsx';
import { Ja } from '../../ui/ja.tsx';
import { SECTION_NAME } from '../../ui/lesson-sections.ts';
import { paths } from '../../ui/paths.ts';
import styles from './today.module.css';

/** About five minutes a part (L6, S3). */
const PART_MINUTES = 5;

type SectionState = 'done' | 'now' | 'later';

function stateOf(unit: UnitView, section: LessonSection): SectionState {
  if (unit.step === section) return 'now';
  const { progress } = unit;
  if (section === 'reading' && progress.readAt !== undefined) return 'done';
  return sectionDone(progress.sections?.[section]) ? 'done' : 'later';
}

function Sections({ unit }: { unit: UnitView }) {
  const t = useT();
  return (
    <ol className={styles.sections} aria-label={t('today.sectionsLabel')}>
      {LESSON_SECTIONS.map((section) => {
        const state = stateOf(unit, section);
        const name = t(SECTION_NAME[section]);
        const label =
          state === 'later'
            ? name
            : t(state === 'done' ? 'today.sectionDone' : 'today.sectionNow', { name });
        return (
          <li
            key={section}
            className={cx(styles.section, styles[state])}
            aria-current={state === 'now' ? 'step' : undefined}
          >
            <span className={styles.sectionBar} aria-hidden="true">
              <span className={styles.sectionFill} />
            </span>
            <span lang="ja">{SECTION_TITLES[section]}</span>
            <span className="visually-hidden"> {label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Continue: the next part's line, as one tap into it; a done unit says so instead. */
function ContinueLink({ unit }: { unit: UnitView }) {
  const t = useT();
  if (unit.step === 'done') return <p className={styles.muted}>{t('today.unitDoneLine')}</p>;
  const part = nextPart(unit.progress.sections?.[unit.step]);
  const line = t('today.sectionLine', {
    title: SECTION_TITLES[unit.step],
    name: t(SECTION_NAME[unit.step]),
    part,
    minutes: t('today.minutes', { n: PART_MINUTES }),
  });
  return (
    <Link to={paths.lessonPart(unit.unit.id, unit.step, part)} className={styles.continue}>
      <span className={styles.continueText}>
        <span className={styles.continueTitle}>{t('today.continue')}</span>
        <span className={styles.continueLine}>{line}</span>
      </span>
      <span className={styles.continueDisc} aria-hidden="true">
        <PlayIcon size={20} />
      </span>
    </Link>
  );
}

/** The unit's title links to its page; the sections show which are done and which is next. */
export function NextUp({ unit }: { unit: UnitView }) {
  const t = useT();
  return (
    <section
      className={styles.next}
      aria-label={t('today.nextUpLabel')}
      data-current-unit={unit.unit.id}
    >
      <p className={styles.kicker}>{t('today.nextUp', { order: unit.unit.order })}</p>
      <Link to={paths.unit(unit.unit.id)} className={styles.unitTitle}>
        <Ja>{unit.unit.titleJa}</Ja>
      </Link>
      <Sections unit={unit} />
      <ContinueLink unit={unit} />
    </section>
  );
}
