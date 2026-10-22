import { useT } from '../../ui/i18n/i18n.tsx';
import type { AiSetupSlotProps } from '../../ui/slots.tsx';
import { KeySection } from './key-section.tsx';
import { ModelSection } from './model-section.tsx';
import styles from './settings.module.css';

/**
 * The key field and, under "Advanced", the model pickers, for the welcome wizard's AI step (P6).
 * The wizard shows the key help itself; a typed key that passes Test key is saved.
 */
export function AiSetup({ settings, onPatch }: AiSetupSlotProps) {
  const t = useT();
  return (
    <>
      <KeySection settings={settings} onPatch={onPatch} help={false} saveOnTest />
      <details className={styles.advanced}>
        <summary className={styles.summary}>{t('settings.advancedModels')}</summary>
        <ModelSection settings={settings} onPatch={onPatch} />
      </details>
    </>
  );
}
