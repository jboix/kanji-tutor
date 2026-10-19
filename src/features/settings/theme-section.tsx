import type { Settings, ThemeMode } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import { applyTheme } from '../../ui/theme.ts';
import styles from './settings.module.css';
import type { PatchSettings } from './use-settings.ts';

const MODES = [
  { value: 'system', key: 'settings.themeSystem' },
  { value: 'light', key: 'settings.themeLight' },
  { value: 'dark', key: 'settings.themeDark' },
] as const satisfies readonly { value: ThemeMode; key: PlainKey }[];

interface Props {
  settings: Settings;
  onPatch: PatchSettings;
}

/** Light, dark, or follow the system (N6). */
export function ThemeSection({ settings, onPatch }: Props) {
  const t = useT();
  const options = MODES.map((mode) => ({ value: mode.value, label: t(mode.key) }));
  const choose = async (theme: ThemeMode) => {
    applyTheme(theme);
    await onPatch({ theme });
  };
  return (
    <section className={styles.section} aria-label={t('settings.theme')}>
      <span className={styles.label} aria-hidden="true">
        {t('settings.theme')}
      </span>
      <SegmentedControl
        label={t('settings.theme')}
        options={options}
        value={settings.theme}
        onChange={choose}
      />
    </section>
  );
}
