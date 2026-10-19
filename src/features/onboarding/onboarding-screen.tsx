import { Navigate } from 'react-router';
import { paths } from '../../ui/paths.ts';
import { resumeStep } from './steps.ts';
import { usePackInstall } from './use-pack-install.ts';
import { useWizardSettings } from './use-wizard-settings.ts';
import { Wizard } from './wizard.tsx';

/**
 * First run (P5): the welcome wizard, resumed at the saved step. Someone already onboarded goes
 * straight to Today; Settings → About can run the wizard again.
 */
export function OnboardingScreen() {
  const { settings, patch } = useWizardSettings();
  const [install, runInstall] = usePackInstall();
  if (!settings || install.phase === 'checking') return null;
  const installed = install.phase === 'done';
  if (settings.onboarded && installed) return <Navigate to={paths.today} replace />;
  // Onboarded once, but the packs are gone (storage cleared): only the dictionary is missing.
  const initial = settings.onboarded
    ? 'dictionary'
    : resumeStep(settings.onboardingStep, installed);
  return (
    <Wizard
      settings={settings}
      patch={patch}
      initial={initial}
      install={install}
      onInstall={() => void runInstall()}
    />
  );
}
