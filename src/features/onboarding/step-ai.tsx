import { useT } from '../../ui/i18n/i18n.tsx';
import { KeyHelp } from '../../ui/key-help.tsx';
import { useSlot } from '../../ui/slots.tsx';
import { StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';

/** The AI tutor (P6): how to get a Gemini key, then the key field, Test key and models. */
export function StepAi({ settings, patch }: Pick<StepProps, 'settings' | 'patch'>) {
  const t = useT();
  const AiSetup = useSlot('aiSetup');
  return (
    <>
      <StepHeading>{t('onboarding.aiHeading')}</StepHeading>
      <KeyHelp />
      {AiSetup && <AiSetup settings={settings} onPatch={patch} />}
    </>
  );
}
