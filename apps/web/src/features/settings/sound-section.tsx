import type { Settings } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import { resumeOf, VolumeSlider, volumeOf, volumePatch } from '../../ui/volume-slider.tsx';
import styles from './settings.module.css';
import type { PatchSettings } from './use-settings.ts';

interface Props {
  settings: Settings;
  onPatch: PatchSettings;
}

/** Listening exercises on or off (S4), for a learner who rarely can listen; on unless turned off. */
function ListeningField({ settings, onPatch }: Props) {
  const t = useT();
  return (
    <div className={styles.field}>
      <span className={styles.label} aria-hidden="true">
        {t('settings.listening')}
      </span>
      <SegmentedControl
        label={t('settings.listening')}
        options={[
          { value: 'on', label: t('settings.listeningOn') },
          { value: 'off', label: t('settings.listeningOff') },
        ]}
        value={settings.listening === false ? 'off' : 'on'}
        onChange={(value) => onPatch({ listening: value === 'on' })}
      />
      <p className={styles.hint}>{t('settings.listeningHint')}</p>
    </div>
  );
}

/**
 * Sound as one knob: the answer tones (U2) and spoken Japanese (R7) together, on unless
 * slid to off. The volume sets how loud the tones are. Off, the speaker buttons hide and
 * sessions leave out listening exercises, which can also be turned off on their own.
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
      <ListeningField settings={settings} onPatch={onPatch} />
    </section>
  );
}
