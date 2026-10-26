import { useState } from 'react';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { IconButton } from '../../ui/icon-button.tsx';
import { BackIcon } from '../../ui/icons.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { stepAfter } from './steps.ts';
import type { InstallState } from './use-pack-install.ts';
import type { Wizard } from './use-wizard.ts';
import styles from './wizard-chrome.module.css';

interface Props {
  wizard: Wizard;
  install: InstallState;
  /** The class step has words to mark but the dictionary is not in yet. */
  waiting: boolean;
  /** A Gemini key is saved: the tutor step's button reads Next, not Skip. */
  hasKey: boolean;
}

/** Whether Next (or Start reading) can be pressed on this step. */
function canGoOn({ wizard, install, waiting }: Props): boolean {
  if (wizard.step === 'summary') return install.phase === 'done';
  if (wizard.step === 'class') return !waiting && wizard.importPhase.phase !== 'running';
  return true;
}

function nextLabel(t: Translate, { wizard, hasKey }: Props): string {
  if (wizard.step === 'summary') return t('onboarding.startReading');
  if (wizard.step === 'ai' && !hasKey) return t('common.skip');
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

/**
 * Back, a round arrow, and Next (P5): selecting an option never moves; only these do. On the tutor step, Next
 * reads Skip until a key is saved, in the same place, so a quick tap never lands on another
 * button.
 */
export function WizardNav(props: Props) {
  const { wizard } = props;
  const t = useT();
  const [busy, run] = useBusy();
  const next = wizard.step === 'summary' ? wizard.finish : wizard.next;
  return (
    <nav className={styles.nav} aria-label={t('onboarding.navLabel')}>
      <div className={styles.navRow}>
        <IconButton
          size={52}
          look="soft"
          className={styles.back}
          aria-label={t('common.back')}
          onClick={() => run(wizard.back)}
          disabled={busy}
        >
          <BackIcon />
        </IconButton>
        <PillButton onClick={() => run(next)} disabled={busy || !canGoOn(props)}>
          {nextLabel(t, props)}
        </PillButton>
      </div>
    </nav>
  );
}
