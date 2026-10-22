import type { Settings } from '../../domain/types.ts';
import type { InstallState } from './use-pack-install.ts';
import type { Wizard } from './use-wizard.ts';
import type { PatchSettings } from './use-wizard-settings.ts';

/** What every step gets from the wizard. */
export interface StepProps {
  wizard: Wizard;
  settings: Settings;
  patch: PatchSettings;
  /** The dictionary download, which keeps going in the background across steps. */
  install: InstallState;
  onInstall: () => void;
}
