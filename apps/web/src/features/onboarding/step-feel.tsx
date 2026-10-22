import type { FuriganaMode } from '../../domain/types.ts';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { Ja } from '../../ui/ja.tsx';
import { SegmentedControl } from '../../ui/segmented-control.tsx';
import { resumeOf, VolumeSlider, volumeOf, volumePatch } from '../../ui/volume-slider.tsx';
import panels from './step-panels.module.css';
import { Lead, StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';
import styles from './wizard.module.css';

const furiganaOptions = (t: Translate) =>
  [
    { value: 'new', label: t('onboarding.furiganaNew') },
    { value: 'all', label: t('onboarding.furiganaAll') },
  ] as const satisfies readonly { value: FuriganaMode; label: string }[];

/** 毎朝、駅まで歩きます。 with 駅 as the word still being learned. */
const PREVIEW: readonly { text: string; reading?: string; learning?: boolean }[] = [
  { text: '毎朝', reading: 'まいあさ' },
  { text: '、' },
  { text: '駅', reading: 'えき', learning: true },
  { text: 'まで' },
  { text: '歩', reading: 'ある' },
  { text: 'きます。' },
];

/** The sentence as a session shows it, with furigana as chosen. */
function Preview({ mode }: { mode: FuriganaMode }) {
  const { rich, t } = useI18n();
  return (
    <div className={styles.preview}>
      <p lang="ja" className={styles.previewSentence}>
        {PREVIEW.map((part) =>
          part.reading && (mode === 'all' || part.learning) ? (
            <ruby key={part.text}>
              {part.text}
              <rt>{part.reading}</rt>
            </ruby>
          ) : (
            <span key={part.text}>{part.text}</span>
          ),
        )}
      </p>
      <p className={styles.previewCaption}>
        {mode === 'all'
          ? t('onboarding.furiganaAllCaption')
          : rich('onboarding.furiganaNewCaption', { word: <Ja>駅</Ja> })}
      </p>
    </div>
  );
}

/** Session feel (U2, R4): furigana tried on a sentence, and the answer sounds as one knob. */
export function StepFeel({ settings, patch }: Pick<StepProps, 'settings' | 'patch'>) {
  const { t } = useI18n();
  return (
    <>
      <StepHeading>{t('onboarding.feelHeading')}</StepHeading>
      <Lead>{t('onboarding.feelLead')}</Lead>
      <Preview mode={settings.furigana} />
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{t('onboarding.furigana')}</span>
        <SegmentedControl
          label={t('onboarding.furigana')}
          options={furiganaOptions(t)}
          value={settings.furigana}
          onChange={(furigana) => void patch({ furigana })}
        />
      </div>
      <div className={panels.group}>
        <div className={panels.groupBody}>
          <VolumeSlider
            label={t('onboarding.sounds')}
            value={volumeOf(settings)}
            resume={resumeOf(settings)}
            onChange={(value) => void patch(volumePatch(value))}
          />
          <span className={panels.rowHint}>{t('onboarding.soundsHint')}</span>
        </div>
      </div>
    </>
  );
}
