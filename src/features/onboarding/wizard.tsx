import { type ReactNode, type RefObject, useEffect, useRef } from 'react';
import type { Settings } from '../../domain/types.ts';
import { cx } from '../../ui/cx.ts';
import { isEmptyChoice, toChoice } from '../../ui/known-import-fields.tsx';
import { Screen } from '../../ui/screen.tsx';
import { isEditable } from '../../ui/use-visual-viewport.ts';
import { StepAi } from './step-ai.tsx';
import { StepClass } from './step-class.tsx';
import { StepDictionary } from './step-dictionary.tsx';
import { StepFeel } from './step-feel.tsx';
import { StepKnown } from './step-known.tsx';
import { StepLanguage } from './step-language.tsx';
import type { StepProps } from './step-props.ts';
import { StepStart } from './step-start.tsx';
import { StepSummary } from './step-summary.tsx';
import { StepWelcome } from './step-welcome.tsx';
import type { StepId } from './steps.ts';
import type { InstallState } from './use-pack-install.ts';
import { type Direction, useWizard } from './use-wizard.ts';
import type { PatchSettings } from './use-wizard-settings.ts';
import styles from './wizard.module.css';
import { WizardHeader } from './wizard-header.tsx';
import { WizardNav } from './wizard-nav.tsx';

type ViewProps = StepProps & { waiting: boolean };

const VIEWS: Record<StepId, (props: ViewProps) => ReactNode> = {
  welcome: () => <StepWelcome />,
  language: (p) => <StepLanguage wizard={p.wizard} />,
  dictionary: (p) => <StepDictionary install={p.install} onInstall={p.onInstall} />,
  start: (p) => <StepStart wizard={p.wizard} />,
  known: (p) => <StepKnown wizard={p.wizard} waiting={p.waiting} />,
  class: (p) => <StepClass wizard={p.wizard} />,
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
  const waiting =
    wizard.step === 'known' &&
    install.phase !== 'done' &&
    !isEmptyChoice(toChoice(wizard.draft.known));
  const props = { wizard, settings, patch, install, onInstall, waiting };
  return (
    <Screen
      topBar={<WizardHeader step={wizard.step} install={install} onInstall={onInstall} />}
      footer={<WizardNav wizard={wizard} install={install} waiting={waiting} />}
    >
      <div ref={area} className={styles.viewport}>
        <div ref={body} key={wizard.step} className={cx(styles.slide, SLIDE[wizard.direction])}>
          {VIEWS[wizard.step](props)}
        </div>
      </div>
    </Screen>
  );
}
