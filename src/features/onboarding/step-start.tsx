import { useT } from '../../ui/i18n/i18n.tsx';
import { KanaNote } from './kana-note.tsx';
import { type CardOption, ChoiceCards, Lead, StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';
import type { StartChoice } from './steps.ts';
import styles from './wizard.module.css';

/** A sentence a learner at each start can read (D134); from zero, a few first kanji. */
const SAMPLES: readonly { value: StartChoice; sample: string }[] = [
  { value: 'zero', sample: '山、川、日、人' },
  { value: 'n5', sample: '毎朝、水を飲みます。' },
  { value: 'n4', sample: '雨が降っていたので、タクシーで帰りました。' },
  { value: 'n3', sample: '経験を生かせる仕事を探しています。' },
];

const TAG = {
  zero: 'onboarding.startZero',
  n5: 'onboarding.startN5',
  n4: 'onboarding.startN4',
  n3: 'onboarding.startN3',
} as const;

const HINT = {
  zero: 'onboarding.startZeroHint',
  n5: 'onboarding.startN5Hint',
  n4: 'onboarding.startN4Hint',
  n3: 'onboarding.startN3Hint',
} as const;

function options(t: ReturnType<typeof useT>): readonly CardOption<StartChoice>[] {
  return SAMPLES.map(({ value, sample }) => ({
    value,
    title: (
      <span className={styles.sample}>
        <span className={styles.sampleTag}>{t(TAG[value])}</span>
        <span lang="ja" className={styles.sampleJa}>
          {sample}
        </span>
      </span>
    ),
    hint: t(HINT[value]),
  }));
}

/**
 * Where you start (P1, P4, D38, D134): the hardest sentence you can read sets the level on Next.
 * From zero, the kana note shows before anything is asked (P8).
 */
export function StepStart({ wizard }: Pick<StepProps, 'wizard'>) {
  const t = useT();
  return (
    <>
      <StepHeading>{t('onboarding.startHeading')}</StepHeading>
      <Lead>{t('onboarding.startLead')}</Lead>
      <ChoiceCards
        label={t('onboarding.startHeading')}
        options={options(t)}
        value={wizard.draft.start}
        onChange={(start) => wizard.setDraft({ start })}
        hintWhenChosen
      />
      {wizard.draft.start === 'zero' && <KanaNote />}
    </>
  );
}
