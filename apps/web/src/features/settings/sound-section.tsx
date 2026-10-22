import type { Settings } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { resumeOf, VolumeSlider, volumeOf, volumePatch } from '../../ui/volume-slider.tsx';
import styles from './settings.module.css';
import type { PatchSettings } from './use-settings.ts';

interface Props {
  settings: Settings;
  onPatch: PatchSettings;
}

/**
 * Sound as one knob: the answer tones (U2) and spoken Japanese (R7) together, on unless
 * slid to off. The volume sets how loud the tones are. Off, the speaker buttons hide and
 * sessions leave out listening exercises.
 */
export function SoundSection({ settings, onPatch }: Props) {
  const t = useT();
  return (
    <section className={styles.section} aria-label={t('settings.sounds')}>
      <VolumeSlider
        label={t('settings.sounds')}
        value={volumeOf(settings)}
        resume={resumeOf(settings)}
        onChange={(value) => onPatch(volumePatch(value))}
      />
      <p className={styles.hint}>{t('settings.soundHint')}</p>
    </section>
  );
}
