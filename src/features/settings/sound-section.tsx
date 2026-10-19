import type { Settings } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { PlainKey } from '../../ui/i18n/types.ts';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import styles from './settings.module.css';
import type { PatchSettings } from './use-settings.ts';

const SOUND = [
  { value: 'on', key: 'settings.on' },
  { value: 'off', key: 'settings.off' },
] as const satisfies readonly { value: string; key: PlainKey }[];

interface Props {
  settings: Settings;
  onPatch: PatchSettings;
}

/**
 * Sound on or off (D125): the answer tones (U2) and spoken Japanese (R7) together, on unless
 * turned off. Off, the speaker buttons hide and sessions leave out listening exercises.
 */
export function SoundSection({ settings, onPatch }: Props) {
  const t = useT();
  return (
    <section className={styles.section} aria-label={t('settings.sounds')}>
      <span className={styles.label} aria-hidden="true">
        {t('settings.sounds')}
      </span>
      <SegmentedControl
        label={t('settings.sounds')}
        options={SOUND.map((o) => ({ value: o.value, label: t(o.key) }))}
        value={settings.sound === false ? 'off' : 'on'}
        onChange={(value) => onPatch({ sound: value === 'on' })}
      />
      <p className={styles.hint}>{t('settings.soundHint')}</p>
    </section>
  );
}
