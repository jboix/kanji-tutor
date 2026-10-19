import { useT } from '../../ui/i18n/i18n.tsx';
import { ProgressLine } from '../../ui/progress-line.tsx';
import { indexOf, STEPS, type StepId } from './steps.ts';
import type { InstallState } from './use-pack-install.ts';
import styles from './wizard-chrome.module.css';

interface Props {
  step: StepId;
  install: InstallState;
  onInstall: () => void;
}

/** "3 of 9" with plain dots: where you are, nothing to collect. */
function Position({ step }: { step: StepId }) {
  const t = useT();
  const at = indexOf(step);
  return (
    <div className={styles.position}>
      <span className={styles.dots} aria-hidden="true">
        {STEPS.map((id, i) => (
          <span key={id} className={i === at ? styles.dotHere : styles.dot} />
        ))}
      </span>
      <span className={styles.count}>
        <span className="visually-hidden">{t('onboarding.stepWord')} </span>
        {t('onboarding.position', { at: at + 1, total: STEPS.length })}
      </span>
    </div>
  );
}

/** The download keeps going on later steps; a thin line says how far, or offers a retry. */
function Background({ step, install, onInstall }: Props) {
  const t = useT();
  if (step === 'dictionary') return null;
  if (install.phase === 'loading') {
    const { progress } = install;
    const value = progress && progress.total > 0 ? progress.loaded / progress.total : 0;
    return (
      <div className={styles.background}>
        <ProgressLine value={value} label={t('onboarding.backgroundLoading')} />
      </div>
    );
  }
  if (install.phase !== 'error') return null;
  return (
    <div className={styles.background} role="alert">
      <span>{t('onboarding.dictionaryFailed')}</span>
      <button type="button" className={styles.retry} onClick={onInstall}>
        {t('onboarding.tryAgain')}
      </button>
    </div>
  );
}

/** The wizard's top: position, and the background download when it matters. */
export function WizardHeader(props: Props) {
  return (
    <header className={styles.header}>
      <Position step={props.step} />
      <Background {...props} />
    </header>
  );
}
