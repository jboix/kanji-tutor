import { useId } from 'react';
import type { Settings } from '../domain/types.ts';
import { useT } from './i18n/i18n.tsx';
import { SpeakerIcon, SpeakerOffIcon } from './icons.tsx';
import styles from './volume-slider.module.css';

/** Settings → Sound as a slider value, 0 (off) to 100 in steps of 10. */
export function volumeOf(settings: Settings): number {
  if (settings.sound === false) return 0;
  return Math.round((settings.soundVolume ?? 1) * 10) * 10;
}

/** The volume to come back to when sound is turned on again: the last one, or full. */
export function resumeOf(settings: Settings): number {
  return Math.max(10, Math.round((settings.soundVolume ?? 1) * 10) * 10);
}

/** The settings a slider value stands for: 0 turns sound off, keeping the last volume. */
export function volumePatch(value: number): Partial<Settings> {
  return value === 0 ? { sound: false } : { sound: true, soundVolume: value / 100 };
}

interface Props {
  label: string;
  value: number;
  /** Where the speaker button brings sound back to after it was off. */
  resume: number;
  onChange: (value: number) => void;
}

const STEP = 10;

type TapProps = Pick<Props, 'value' | 'resume' | 'onChange'>;

/** The left speaker: sound off, or back on at the last volume, in one tap (WCAG 2.5.7). */
function Toggle({ value, resume, onChange }: TapProps) {
  const t = useT();
  const off = value === 0;
  return (
    <button
      type="button"
      className={styles.tap}
      aria-label={t('ui.volumeMute')}
      aria-pressed={off}
      onClick={() => onChange(off ? resume : 0)}
    >
      <SpeakerOffIcon />
    </button>
  );
}

/** The right speaker: one step louder. */
function Louder({ value, onChange }: TapProps) {
  const t = useT();
  return (
    <button
      type="button"
      className={styles.tap}
      aria-label={t('ui.volumeUp')}
      disabled={value >= 100}
      onClick={() => onChange(Math.min(100, value + STEP))}
    >
      <SpeakerIcon />
    </button>
  );
}

/**
 * Sound as one knob (U2): all the way left is off, so no separate switch. The speaker on
 * the left turns it off and back on, the one on the right turns it up, so it never needs a drag.
 */
export function VolumeSlider({ label, value, resume, onChange }: Props) {
  const t = useT();
  const id = useId();
  const text = value === 0 ? t('ui.volumeOff') : t('ui.percent', { n: value });
  return (
    <div className={styles.slider}>
      <div className={styles.top}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <span className={styles.value} aria-hidden="true">
          {text}
        </span>
      </div>
      <div className={styles.track}>
        <Toggle value={value} resume={resume} onChange={onChange} />
        <input
          id={id}
          className={styles.input}
          type="range"
          min={0}
          max={100}
          step={STEP}
          value={value}
          aria-valuetext={text}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <Louder value={value} resume={resume} onChange={onChange} />
      </div>
    </div>
  );
}
