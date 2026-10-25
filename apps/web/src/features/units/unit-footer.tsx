/**
 * A unit page's footer, held at the bottom of the screen: the tutor's 解 beside the lesson's
 * next step ("Continue the lesson · 文法 · 5 min"), so both are in reach without scrolling.
 */
import { useMemo } from 'react';
import {
  type LessonSection,
  PART_SECONDS,
  SECTION_TITLES,
  type UnitView,
} from '../../domain/services/index.ts';
import { useI18n, useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { StickyActions } from '../../ui/sticky-actions.tsx';
import { TutorNext, useTutor } from '../../ui/tutor.tsx';
import { type Mode, useOpenSection } from './unit-parts.tsx';
import styles from './units.module.css';

/** The section the lesson goes on with: the step it is on, まとめ again once done. */
function nextSection(view: UnitView): LessonSection {
  if (!view.pack) return 'reading';
  return view.step === 'done' ? 'review' : view.step;
}

function actionKey(view: UnitView): PlainKey {
  if (view.step === 'done') return 'units.practiseAgain';
  const { introducedAt, sections = {} } = view.progress;
  const started = introducedAt !== undefined || Object.keys(sections).length > 0;
  return started ? 'units.continueLesson' : 'units.startLesson';
}

/** The tutor on the unit: its passage as the sentence, its theme as what it is about. */
function useUnitTutor(view: UnitView) {
  const t = useT();
  const { unit } = view;
  const options = useMemo(() => {
    const lines = unit.passage.sentences;
    return {
      topic: {
        about: unit.titleJa,
        sentence: {
          text: lines.map((line) => line.ja).join(''),
          translation: lines.map((line) => line.en).join(' '),
        },
      },
      starters: [t('units.tutorBefore'), t('units.tutorGrammar')],
    };
  }, [unit, t]);
  return useTutor(options);
}

/** The footer (see the module comment). */
export function UnitFooter({ view, onMode }: { view: UnitView; onMode: (mode: Mode) => void }) {
  const { t, rich } = useI18n();
  const tutor = useUnitTutor(view);
  const open = useOpenSection(view, onMode);
  const section = nextSection(view);
  const sub = rich('units.lessonSub', {
    section: <Ja>{SECTION_TITLES[section]}</Ja>,
    minutes: Math.round(PART_SECONDS / 60),
  });
  return (
    <StickyActions>
      <TutorNext tutor={tutor}>
        <PillButton block onClick={() => open(section)}>
          <span className={styles.pillText}>
            {t(actionKey(view))}
            <span data-sub="">{sub}</span>
          </span>
        </PillButton>
      </TutorNext>
    </StickyActions>
  );
}
