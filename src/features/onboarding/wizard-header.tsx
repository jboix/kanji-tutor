import { useT } from '../../ui/i18n/i18n.tsx';
import { type DownloadProps, DownloadStatus } from './download-status.tsx';
import { indexOf, NUMBERED, STEPS, type StepId } from './steps.ts';
import styles from './wizard-chrome.module.css';

interface Props extends DownloadProps {
  step: StepId;
}

const segment = (i: number, at: number) => {
  if (i < at) return styles.done;
  return i === at ? styles.here : styles.segment;
};

/** "3 of 6" with a line of short segments: where you are, nothing to collect. */
function Position({ step }: { step: StepId }) {
  const t = useT();
  const at = indexOf(step);
  return (
    <div className={styles.position}>
      <span className={styles.segments} aria-hidden="true">
        {STEPS.slice(1).map((id, i) => (
          <span key={id} className={segment(i + 1, at)} />
        ))}
      </span>
      <span className={styles.count}>
        <span className="visually-hidden">{t('onboarding.stepWord')} </span>
        {t('onboarding.position', { at, total: NUMBERED })}
      </span>
    </div>
  );
}

/** The wizard's top: position, and the background download when it matters. */
export function WizardHeader(props: Props) {
  return (
    <header className={styles.header}>
      <Position step={props.step} />
      <DownloadStatus install={props.install} onInstall={props.onInstall} queue={props.queue} />
    </header>
  );
}
