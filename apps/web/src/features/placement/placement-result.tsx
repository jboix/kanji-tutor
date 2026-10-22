import { useMemo, useState } from 'react';
import type { AssessLevelInput } from '../../ai/types.ts';
import { areaNotes, proposedLevel } from '../../domain/placement/index.ts';
import { LEARNER_LEVELS } from '../../domain/services/learner-level.ts';
import type { LearnerLevel } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { paths } from '../../ui/paths.ts';
import { PillButton, PillLink } from '../../ui/pill-button.tsx';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import { useServices } from '../../ui/services.tsx';
import styles from './placement.module.css';
import { areaText, WRITING_PROMPT } from './placement-copy.ts';
import { TutorAssessment } from './tutor-assessment.tsx';
import { useAssessment } from './use-assessment.ts';
import type { PlacementState } from './use-placement.ts';

const LEVELS = LEARNER_LEVELS.map((level) => ({ value: String(level), label: `N${level}` }));

function assessInput(state: PlacementState, proposed: LearnerLevel): AssessLevelInput {
  const input: AssessLevelInput = { answers: [...state.answers], staircaseLevel: proposed };
  if (state.written.trim() === '') return input;
  return {
    ...input,
    writingPrompt: WRITING_PROMPT[state.stairs.level],
    written: state.written.trim(),
  };
}

function Accepted({ level }: { level: LearnerLevel }) {
  const t = useT();
  return (
    <section className={styles.card} aria-label={t('placement.yourLevel')}>
      <p className={styles.lead} role="status">
        {t('placement.accepted', { level })}
      </p>
      <PillLink to={paths.today} arrow>
        {t('placement.backToToday')}
      </PillLink>
    </section>
  );
}

/**
 * The placement's result (A11): the staircase's level and a note per area; the tutor's view when
 * asked; then the learner accepts a level or picks another. Nothing changes until they do.
 */
export function PlacementResult({ state }: { state: PlacementState }) {
  const { repos } = useServices();
  const proposed = proposedLevel(state.stairs.steps);
  const input = useMemo(() => assessInput(state, proposed), [state, proposed]);
  const tutor = useAssessment(input);
  const suggested = tutor.state.status === 'done' ? tutor.state.value.level : proposed;
  const [picked, setPicked] = useState<LearnerLevel>();
  const [accepted, setAccepted] = useState<LearnerLevel>();
  const level = picked ?? suggested;
  const t = useT();
  if (accepted) return <Accepted level={accepted} />;
  const accept = async () => {
    await repos.settings.patch({ learnerLevel: level });
    setAccepted(level);
  };
  return (
    <section className={styles.card} aria-label={t('placement.yourResult')}>
      <h2 className={styles.lead}>{t('placement.pointsTo', { level: proposed })}</h2>
      <ul className={styles.list}>
        {areaNotes(state.stairs.steps).map((note) => (
          <li key={note.kind}>{areaText(t, note)}</li>
        ))}
      </ul>
      <TutorAssessment state={tutor.state} onAsk={tutor.ask} peek={tutor.peek} />
      <SegmentedControl
        label={t('placement.levelToUse')}
        options={LEVELS}
        value={String(level)}
        onChange={(value) => setPicked(Number(value) as LearnerLevel)}
      />
      <PillButton onClick={() => void accept()}>{t('placement.use', { level })}</PillButton>
      <p className={styles.muted}>{t('placement.changeLater')}</p>
    </section>
  );
}
