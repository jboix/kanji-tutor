import { type ReactNode, type RefObject, useEffect, useRef } from 'react';
import type { Settings } from '../../domain/types.ts';
import { cx } from '../../ui/cx.ts';
import { languageOf } from '../../ui/languages.ts';
import { Screen } from '../../ui/screen.tsx';
import { isEditable } from '../../ui/use-visual-viewport.ts';
import { StepAi } from './step-ai.tsx';
import { StepClass } from './step-class.tsx';
import { StepFeel } from './step-feel.tsx';
import { StepLanguage } from './step-language.tsx';
import type { StepProps } from './step-props.ts';
import { StepStart } from './step-start.tsx';
import { StepSummary } from './step-summary.tsx';
import type { StepId } from './steps.ts';
import type { InstallState } from './use-pack-install.ts';
import { usePackQueue } from './use-pack-queue.ts';
import {
  type Direction,
  marksOnClass,
  useWizard,
  type Wizard as WizardState,
} from './use-wizard.ts';
import type { PatchSettings } from './use-wizard-settings.ts';
import { WelcomeScreen } from './welcome-screen.tsx';
import styles from './wizard.module.css';
import { WizardHeader } from './wizard-header.tsx';
import { WizardNav } from './wizard-nav.tsx';

type ViewProps = StepProps & { waiting: boolean };

const VIEWS: Record<Exclude<StepId, 'welcome'>, (props: ViewProps) => ReactNode> = {
  language: (p) => <StepLanguage wizard={p.wizard} />,
  start: (p) => <StepStart wizard={p.wizard} />,
  class: (p) => <StepClass wizard={p.wizard} waiting={p.waiting} />,
  ai: (p) => <StepAi settings={p.settings} patch={p.patch} />,
  feel: (p) => <StepFeel settings={p.settings} patch={p.patch} />,
  summary: (p) => <StepSummary {...p} />,
};

const SLIDE: Record<Direction, string | undefined> = {
  forward: styles.forward,
  back: styles.back,
  none: undefined,
};

/** Each new step gets the focus on its heading, and the body scrolls back to the top. */
function useStepFocus(body: RefObject<HTMLDivElement | null>, step: StepId) {
  const shown = useRef(step);
  useEffect(() => {
    if (shown.current === step) return;
    shown.current = step;
    body.current?.closest('main')?.scrollTo?.({ top: 0 });
    body.current?.querySelector<HTMLElement>('[data-step-heading]')?.focus({ preventScroll: true });
  }, [body, step]);
}

/** A focused field scrolls into the space left above the on-screen keyboard (U1). */
function useKeepInView(area: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const element = area.current;
    if (!element) return;
    const onFocus = (event: FocusEvent) => {
      const field = event.target;
      if (!(field instanceof HTMLElement) || !isEditable(field)) return;
      setTimeout(() => field.scrollIntoView?.({ block: 'center' }), 300);
    };
    element.addEventListener('focusin', onFocus);
    return () => element.removeEventListener('focusin', onFocus);
  }, [area]);
}

/**
 * The dictionary loads in the background from the welcome's Start, and again on a
 * reload past the welcome; after a failure, the header offers a retry.
 */
function useBackgroundInstall(step: StepId, install: InstallState, onInstall: () => void) {
  useEffect(() => {
    if (step !== 'welcome' && install.phase === 'idle') onInstall();
  }, [step, install.phase, onInstall]);
}

/** The class step has words to mark, but the dictionary is not in yet. */
function isWaiting(wizard: WizardState, install: InstallState): boolean {
  return wizard.step === 'class' && install.phase !== 'done' && marksOnClass(wizard.draft);
}

export interface WizardProps {
  settings: Settings;
  patch: PatchSettings;
  initial: StepId;
  install: InstallState;
  onInstall: () => void;
}

/** The welcome wizard (P5): one step at a time, sliding in, with Back, Next and Skip. */
export function Wizard({ settings, patch, initial, install, onInstall }: WizardProps) {
  const wizard = useWizard(settings, initial, patch);
  const body = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  useStepFocus(body, wizard.step);
  useKeepInView(area);
  useBackgroundInstall(wizard.step, install, onInstall);
  const queue = usePackQueue(languageOf(settings.uiLanguage), install);
  if (wizard.step === 'welcome') return <WelcomeScreen onStart={() => void wizard.next()} />;
  const waiting = isWaiting(wizard, install);
  const props = { wizard, settings, patch, install, onInstall, waiting };
  const view = VIEWS[wizard.step];
  return (
    <Screen
      topBar={
        <WizardHeader step={wizard.step} install={install} onInstall={onInstall} queue={queue} />
      }
      footer={
        <WizardNav
          wizard={wizard}
          install={install}
          waiting={waiting}
          hasKey={Boolean(settings.apiKey)}
        />
      }
    >
      <div ref={area} className={styles.viewport}>
        <div ref={body} key={wizard.step} className={cx(styles.slide, SLIDE[wizard.direction])}>
          {view(props)}
        </div>
      </div>
    </Screen>
  );
}
