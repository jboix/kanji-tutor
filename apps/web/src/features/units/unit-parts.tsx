/**
 * A unit's lesson sections (S3) as the parts of a lesson page: each one's Japanese title and
 * name, a sample of what it holds, its parts done, and a tap to open it.
 */
import { useNavigate } from 'react-router';
import {
  LESSON_SECTIONS,
  type LessonSection,
  nextPart,
  SECTION_TITLES,
  sectionDone,
  type UnitView,
} from '../../domain/services/index.ts';
import { unitGrammar } from '../../domain/themes/index.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey, Translate } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { SECTION_NAME } from '../../ui/lesson-sections.ts';
import { paths } from '../../ui/paths.ts';
import { SectionRow, type SectionState } from './section-row.tsx';
import styles from './units.module.css';

export type Mode = 'overview' | 'read';

const DETAIL: Readonly<Record<LessonSection, PlainKey>> = {
  words: 'units.detailWords',
  grammar: 'units.detailGrammar',
  practice: 'units.detailPractice',
  reading: 'units.detailReading',
  review: 'units.detailReview',
};

/** Japanese from the unit for the sections that teach it; the mixed ones have none. */
const SAMPLE: Partial<Record<LessonSection, (view: UnitView) => string | undefined>> = {
  words: (view) =>
    view.unit.words
      .slice(0, 6)
      .map((word) => word.written)
      .join(' '),
  grammar: (view) =>
    unitGrammar(view.unit)
      .map((point) => point.pattern)
      .join(' '),
  reading: (view) => view.unit.passage.sentences[0]?.ja,
};

/** The Read step of the earlier path counts as 読み物 done. */
function isDone(view: UnitView, section: LessonSection): boolean {
  const progress = view.progress.sections?.[section];
  if (sectionDone(progress)) return true;
  return section === 'reading' && !progress && view.progress.readAt !== undefined;
}

/** "1 of 2" for a started section's parts, "Done" once all are; nothing before it starts. */
function countOf(t: Translate, view: UnitView, section: LessonSection) {
  if (isDone(view, section)) return { aside: t('units.sectionDone') };
  const progress = view.progress.sections?.[section];
  return progress && progress.parts > 0
    ? { count: { done: progress.done, total: progress.parts } }
    : {};
}

function stateOf(view: UnitView, section: LessonSection): SectionState {
  if (view.step === section) return 'now';
  return isDone(view, section) ? 'done' : 'later';
}

/** The first part to do of a section: its session, or for 読み物 the passage first. */
export function useOpenSection(view: UnitView, onMode: (mode: Mode) => void) {
  const navigate = useNavigate();
  return (section: LessonSection) => {
    if (section === 'reading') onMode('read');
    else {
      const part = nextPart(view.progress.sections?.[section]);
      void navigate(paths.lessonPart(view.unit.id, section, part));
    }
  };
}

interface PartProps {
  view: UnitView;
  section: LessonSection;
  order: number;
  open: (section: LessonSection) => void;
}

function UnitPart({ view, section, order, open }: PartProps) {
  const { t, rich } = useI18n();
  const name = rich('units.partName', {
    title: <Ja>{SECTION_TITLES[section]}</Ja>,
    name: t(SECTION_NAME[section]),
  });
  const current = view.step === section;
  return (
    <li data-section={section} aria-current={current ? 'step' : undefined}>
      <SectionRow
        order={order}
        state={stateOf(view, section)}
        name={name}
        sample={SAMPLE[section]?.(view)}
        detail={t(DETAIL[section])}
        onClick={() => open(section)}
        {...countOf(t, view, section)}
      />
    </li>
  );
}

/** The lesson's sections in textbook order (S3); without the unit in the packs, 読み物 only. */
export function UnitParts({ view, onMode }: { view: UnitView; onMode: (mode: Mode) => void }) {
  const t = useT();
  const open = useOpenSection(view, onMode);
  const shown = view.pack ? LESSON_SECTIONS : (['reading'] as const);
  return (
    <section aria-label={t('units.steps')}>
      <ol className={styles.parts}>
        {shown.map((section) => (
          <UnitPart
            key={section}
            view={view}
            section={section}
            order={LESSON_SECTIONS.indexOf(section) + 1}
            open={open}
          />
        ))}
      </ol>
    </section>
  );
}
