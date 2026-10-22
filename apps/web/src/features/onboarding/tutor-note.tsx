import { AiBlock } from '../../ui/ai-block.tsx';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';

/**
 * A sample of the tutor's margin note (D134): why 待 is not 持, in the chosen language, in the AI
 * box as every tutor text is (D57). Shown on the language and tutor steps; it is a fixed example,
 * not a request.
 */
export function TutorNote() {
  const { rich } = useI18n();
  return (
    <AiBlock size="sm">
      {rich('onboarding.tutorSample', {
        wait: <Ja>待</Ja>,
        road: <Ja>彳</Ja>,
        hold: <Ja>持</Ja>,
        hand: <Ja>扌</Ja>,
      })}
    </AiBlock>
  );
}
