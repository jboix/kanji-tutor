import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { SECTION_TITLES, type StartPlan } from '../domain/services/index.ts';
import { BottomSheet } from './bottom-sheet.tsx';
import { useI18n } from './i18n/i18n.tsx';
import { BookIcon, MixIcon, PlayIcon } from './icons.tsx';
import { Ja } from './ja.tsx';
import { SECTION_NAME } from './lesson-sections.ts';
import { offeredState } from './session-handoff.ts';
import { startPath } from './start-path.ts';
import styles from './start-sheet.module.css';
import { type StartOptions, useStartOptions } from './use-start-options.ts';

interface OptionProps {
  icon: ReactNode;
  title: string;
  line: ReactNode;
  plan: StartPlan;
  /** The lesson part: drawn first and stronger, as the round to go on with. */
  first?: boolean;
}

/** One round to start; a tap plays it at once. */
function Option({ icon, title, line, plan, first }: OptionProps) {
  const navigate = useNavigate();
  const start = () => {
    const state = plan.kind === 'mix' ? offeredState(Date.now()) : undefined;
    void navigate(startPath(plan), { state });
  };
  return (
    <button type="button" className={first ? styles.first : styles.option} onClick={start}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        <span className={styles.line}>{line}</span>
      </span>
    </button>
  );
}

function LessonOption({ plan }: { plan: NonNullable<StartOptions['lesson']> }) {
  const { t } = useI18n();
  const section = `${SECTION_TITLES[plan.section]} · ${t(SECTION_NAME[plan.section])}`;
  return (
    <Option
      first
      icon={<PlayIcon />}
      title={t('ui.startLesson')}
      line={t('ui.startLessonLine', { section, part: String(plan.part) })}
      plan={plan}
    />
  );
}

/** Grammar, on the point it would practise when there is one, and kanji cards. */
function FocusOptions({ grammar, pattern, kanji }: Omit<StartOptions, 'lesson'>) {
  const { t, rich } = useI18n();
  const grammarLine = pattern
    ? rich('ui.startGrammarLine', { pattern: <Ja>{pattern}</Ja> })
    : t('ui.startGrammarAny');
  const kanjiLine = t('ui.startKanjiAny');
  return (
    <>
      <Option icon={<Ja>文</Ja>} title={t('ui.startGrammar')} line={grammarLine} plan={grammar} />
      <Option icon={<Ja>漢</Ja>} title={t('ui.startKanji')} line={kanjiLine} plan={kanji} />
    </>
  );
}

function Options({ options }: { options: StartOptions }) {
  const { t } = useI18n();
  const { lesson, ...focus } = options;
  return (
    <>
      {lesson && <LessonOption plan={lesson} />}
      <Option
        icon={<MixIcon />}
        title={t('ui.startMix')}
        line={t('ui.startMixLine')}
        plan={{ kind: 'mix' }}
      />
      <Option
        icon={<BookIcon />}
        title={t('ui.startReading')}
        line={t('ui.startReadingLine')}
        plan={{ kind: 'reading' }}
      />
      <FocusOptions {...focus} />
    </>
  );
}

/** The centre button's choices (IA3): go on with the lesson, or pick another round. */
export function StartSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const options = useStartOptions(open);
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      label={t('ui.startTitle')}
      header={<h2 className={styles.heading}>{t('ui.startTitle')}</h2>}
    >
      <div className={styles.options}>
        {options ? (
          <Options options={options} />
        ) : (
          <p className={styles.status} role="status">
            {t('ui.startChoosing')}
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
