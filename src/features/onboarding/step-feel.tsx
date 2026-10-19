import type { FuriganaMode } from '../../domain/types.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import { sound } from '../../ui/sound.ts';
import { Lead, StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';
import styles from './wizard.module.css';

const soundOptions = (t: Translate) =>
  [
    { value: 'on', label: t('onboarding.on') },
    { value: 'off', label: t('onboarding.off') },
  ] as const;

const furiganaOptions = (t: Translate) =>
  [
    { value: 'new', label: t('onboarding.furiganaNew') },
    { value: 'all', label: t('onboarding.furiganaAll') },
  ] as const satisfies readonly { value: FuriganaMode; label: string }[];

/** A right answer's tone, then a wrong one's (U2). */
function playSample() {
  sound.unlock();
  sound.play('correct');
  setTimeout(() => sound.play('wrong'), 650);
}

/** Session feel (U2, R4): answer sounds with a sample, and furigana by default. */
export function StepFeel({ settings, patch }: Pick<StepProps, 'settings' | 'patch'>) {
  const t = useT();
  const on = settings.sound !== false;
  return (
    <>
      <StepHeading>{t('onboarding.feelHeading')}</StepHeading>
      <Lead>{t('onboarding.feelLead')}</Lead>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t('onboarding.sounds')}</span>
        <div className={styles.inline}>
          <SegmentedControl
            label={t('onboarding.sounds')}
            options={soundOptions(t)}
            value={on ? 'on' : 'off'}
            onChange={(value) => void patch({ sound: value === 'on' })}
          />
          <button type="button" className={styles.secondary} onClick={playSample} disabled={!on}>
            {t('onboarding.playSample')}
          </button>
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t('onboarding.furigana')}</span>
        <SegmentedControl
          label={t('onboarding.furigana')}
          options={furiganaOptions(t)}
          value={settings.furigana}
          onChange={(furigana) => void patch({ furigana })}
        />
      </div>
    </>
  );
}
