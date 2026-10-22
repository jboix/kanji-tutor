import { useT } from '../../ui/i18n/i18n.tsx';
import { ProgressLine } from '../../ui/progress-line.tsx';
import type { ImportPhase } from '../../ui/use-known-import.ts';
import { knownText, markingText } from './known-text.ts';
import { Note } from './step-parts.tsx';
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

/** Marking what you know (K6): its progress, a failure, the wait for the dictionary, or done. */
export function KnownStatus({ wizard, waiting }: Pick<StepProps, 'wizard'> & { waiting: boolean }) {
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
