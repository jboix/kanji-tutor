import { useState } from 'react';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { PillButton } from '../../ui/pill-button.tsx';
import { SKIPPABLE, stepAfter } from './steps.ts';
import type { InstallState } from './use-pack-install.ts';
import type { Wizard } from './use-wizard.ts';
import styles from './wizard-chrome.module.css';

interface Props {
  wizard: Wizard;
  install: InstallState;
  /** The known step has lists to mark but the dictionary is not in yet. */
  waiting: boolean;
}

/** Whether Next (or Start reading) can be pressed on this step. */
function canGoOn({ wizard, install, waiting }: Props): boolean {
  if (wizard.step === 'dictionary') return install.phase === 'loading' || install.phase === 'done';
  if (wizard.step === 'summary') return install.phase === 'done';
  if (wizard.step === 'known') return !waiting && wizard.importPhase.phase !== 'running';
  return true;
}

function nextLabel(t: Translate, wizard: Wizard): string {
  if (wizard.step === 'summary') return t('onboarding.startReading');
  if (wizard.returning && stepAfter(wizard.step, true) === 'summary') {
    return t('onboarding.backToSummary');
  }
  return t('common.next');
}

/** Runs one move at a time, so a double tap cannot skip a step. */
function useBusy() {
  const [busy, setBusy] = useState(false);
  const run = (move: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    void move().finally(() => setBusy(false));
  };
  return [busy, run] as const;
}

function Skip({ wizard, run }: { wizard: Wizard; run: (move: () => Promise<void>) => void }) {
  const t = useT();
  if (!SKIPPABLE.has(wizard.step)) return null;
  const ai = wizard.step === 'ai';
  return (
    <div className={styles.skipRow}>
      <button type="button" className={styles.skip} onClick={() => run(wizard.skip)}>
        {ai ? t('onboarding.skipForNow') : t('common.skip')}
      </button>
      {ai && <span className={styles.skipHint}>{t('onboarding.skipAiHint')}</span>}
    </div>
  );
}

/** Back, Next and Skip (P5). Selecting an option never moves; only these do. */
export function WizardNav(props: Props) {
  const { wizard } = props;
  const t = useT();
  const [busy, run] = useBusy();
  const next = wizard.step === 'summary' ? wizard.finish : wizard.next;
  return (
    <nav className={styles.nav} aria-label={t('onboarding.navLabel')}>
      <div className={styles.navRow}>
        {wizard.step !== 'welcome' && (
          <PillButton variant="secondary" onClick={() => run(wizard.back)} disabled={busy}>
            {t('common.back')}
          </PillButton>
        )}
        <PillButton onClick={() => run(next)} disabled={busy || !canGoOn(props)} grow={1.4}>
          {nextLabel(t, wizard)}
        </PillButton>
      </div>
      <Skip wizard={wizard} run={run} />
    </nav>
  );
}
