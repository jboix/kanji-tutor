/** "What to practise" on Today (IA2): the choice Start follows (IA3), and what it will play. */
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { SECTION_TITLES, type UnitView } from '../../domain/services/index.ts';
import type { PracticeChoice } from '../../domain/types.ts';
import { Chip, ChipRow } from '../../ui/chip.tsx';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { SECTION_NAME } from '../../ui/lesson-sections.ts';
import { paths } from '../../ui/paths.ts';
import type { HandoffState } from '../../ui/session-handoff.ts';
import styles from './today.module.css';
import { type PracticeView, usePractice } from './use-practice.ts';

const CHOICES = [
  ['mix', 'today.choiceMix'],
  ['lesson', 'today.choiceLesson'],
  ['reading', 'today.choiceReading'],
  ['grammar', 'today.choiceGrammar'],
  ['kanji', 'today.choiceKanji'],
] as const satisfies readonly (readonly [PracticeChoice, PlainKey])[];

const PART_MINUTES = 5;

interface LineProps {
  view: PracticeView;
  unit: UnitView | undefined;
  /** The daily mix's own line: "6 sentences and 4 exercises, about 5 minutes." */
  mix: ReactNode;
  /** The session Today built, for "Just the daily mix" (N10). */
  handoff?: HandoffState | undefined;
}

function LessonLine({ view, unit, handoff }: Omit<LineProps, 'mix'>) {
  const { t, rich } = useI18n();
  const { plan } = view;
  if (plan.kind !== 'lesson') return <>{t('today.noLesson')}</>;
  const minutes = t('today.minutes', { n: PART_MINUTES });
  const section = `${SECTION_TITLES[plan.section]} · ${t(SECTION_NAME[plan.section])}`;
  if (view.choice === 'mix') {
    return (
      <>
        <span>{t('today.mixLessonFirst', { section, minutes })}</span>
        <Link to={paths.read} state={handoff} className={styles.mixNow}>
          {t('today.mixNow')}
        </Link>
      </>
    );
  }
  const title = <Ja>{unit?.unit.titleJa ?? plan.unit}</Ja>;
  return (
    <>{rich('today.lessonLine', { section, unit: title, part: String(plan.part), minutes })}</>
  );
}

function FocusLine({ view }: { view: PracticeView }) {
  const { t, rich } = useI18n();
  const { plan } = view;
  if (plan.kind === 'grammar') {
    const pattern = view.pattern ?? plan.grammar;
    if (!pattern) return <>{t('today.grammarAny')}</>;
    return <>{rich('today.grammarLine', { pattern: <Ja>{pattern}</Ja> })}</>;
  }
  if (plan.kind === 'kanji' && plan.focus) {
    const { kanji, reading } = plan.focus;
    return <>{rich('today.kanjiLine', { kanji: <Ja>{kanji}</Ja>, reading: <Ja>{reading}</Ja> })}</>;
  }
  return <>{t('today.kanjiAny')}</>;
}

/** What Start will play for the choice. */
function PlanLine({ view, unit, mix, handoff }: LineProps) {
  const t = useT();
  const { plan, choice } = view;
  if (plan.kind === 'lesson' || choice === 'lesson') {
    return <LessonLine view={view} unit={unit} handoff={handoff} />;
  }
  if (plan.kind === 'reading') return <>{t('today.readingLine')}</>;
  if (plan.kind === 'mix') return <>{mix}</>;
  return <FocusLine view={view} />;
}

export interface PracticeProps {
  now: number;
  unit: UnitView | undefined;
  mix: ReactNode;
  handoff?: HandoffState | undefined;
}

/** Five choices as toggle chips; the line under them says what Start plays. */
export function Practice({ now, unit, mix, handoff }: PracticeProps) {
  const t = useT();
  const { view, choose } = usePractice(now);
  return (
    <section className={styles.practice} aria-labelledby="practise-title">
      <h2 id="practise-title" className={styles.panelTitle}>
        {t('today.practiseLabel')}
      </h2>
      <ChipRow>
        {CHOICES.map(([choice, label]) => (
          <Chip
            key={choice}
            className={styles.choice}
            aria-pressed={view?.choice === choice}
            disabled={!view}
            onClick={() => choose(choice)}
          >
            {t(label)}
          </Chip>
        ))}
      </ChipRow>
      <div className={styles.planLine} aria-live="polite">
        {view && <PlanLine view={view} unit={unit} mix={mix} handoff={handoff} />}
      </div>
    </section>
  );
}
