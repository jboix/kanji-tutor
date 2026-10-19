import { useT } from '../../ui/i18n/i18n.tsx';
import { KnownImportFields, type SetKnownDraft } from '../../ui/known-import-fields.tsx';
import { ProgressLine } from '../../ui/progress-line.tsx';
import type { ImportPhase } from '../../ui/use-known-import.ts';
import { knownText, markingText } from './known-text.ts';
import { Lead, Note, StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';
import styles from './wizard.module.css';

function Marking({ phase }: { phase: Extract<ImportPhase, { phase: 'running' }> }) {
  const t = useT();
  const text = markingText(t, phase.done, phase.total);
  return (
    <div className={styles.loading}>
      <ProgressLine value={phase.total > 0 ? phase.done / phase.total : 0} label={text} />
      <p className={styles.stage} aria-live="polite">
        {text}
      </p>
    </div>
  );
}

function Status({ wizard, waiting }: { wizard: StepProps['wizard']; waiting: boolean }) {
  const t = useT();
  const phase = wizard.importPhase;
  if (phase.phase === 'running') return <Marking phase={phase} />;
  if (phase.phase === 'failed') {
    return <Note alert>{t('onboarding.knownFailed')}</Note>;
  }
  if (waiting) return <Note>{t('onboarding.knownWaiting')}</Note>;
  if (wizard.known?.marked) {
    const text = knownText(t, { marked: wizard.known.marked, pending: [] });
    return <Note>{t('onboarding.knownDone', { text })}</Note>;
  }
  return null;
}

/**
 * What you already know (K6, D38): the lists ticked by your start, Minna lessons and your own
 * list. Next marks them; Skip marks nothing. Marking twice adds nothing twice (P2).
 */
export function StepKnown({ wizard, waiting }: Pick<StepProps, 'wizard'> & { waiting: boolean }) {
  const t = useT();
  const set: SetKnownDraft = (key, value) =>
    wizard.setDraft({ known: { ...wizard.draft.known, [key]: value } });
  return (
    <>
      <StepHeading>{t('onboarding.knownHeading')}</StepHeading>
      <Lead>{t('onboarding.knownLead')}</Lead>
      <KnownImportFields draft={wizard.draft.known} set={set} known />
      <Status wizard={wizard} waiting={waiting} />
    </>
  );
}
