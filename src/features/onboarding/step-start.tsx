import { useT } from '../../ui/i18n/i18n.tsx';
import type { Translate } from '../../ui/i18n/types.ts';
import { KanaNote } from './kana-note.tsx';
import { type CardOption, ChoiceCards, Lead, StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';
import type { StartChoice } from './steps.ts';

function options(t: Translate): readonly CardOption<StartChoice>[] {
  return [
    { value: 'zero', title: t('onboarding.startZero'), hint: t('onboarding.startZeroHint') },
    { value: 'n5', title: t('onboarding.startN5'), hint: t('onboarding.startN5Hint') },
    { value: 'n4', title: t('onboarding.startN4'), hint: t('onboarding.startN4Hint') },
    { value: 'n3', title: t('onboarding.startN3'), hint: t('onboarding.startN3Hint') },
  ];
}

/**
 * Where you start (P1, P4, D38): sets the level on Next; the lists come in the next step. From
 * zero, the kana note shows again before anything is asked (P8).
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
        onChange={wizard.setStart}
      />
      {wizard.draft.start === 'zero' && <KanaNote />}
    </>
  );
}
