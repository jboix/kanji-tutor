import { useI18n } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { KeyHelp } from '../../ui/key-help.tsx';
import { useSlot } from '../../ui/slots.tsx';
import { Lead, Note, StepHeading } from './step-parts.tsx';
import type { StepProps } from './step-props.ts';
import { TutorNote } from './tutor-note.tsx';
import styles from './wizard.module.css';

/** What the tutor does, as a fixed example: a miss on 待つ and its margin note. */
function Demo() {
  const { rich } = useI18n();
  return (
    <div className={styles.demo}>
      <p lang="ja" className={styles.demoSentence}>
        駅で友だちを<span className={styles.demoTarget}>待つ</span>。
      </p>
      <p className={styles.demoMiss}>
        {rich('onboarding.aiMiss', { wrong: <Ja>もつ</Ja>, right: <Ja>まつ</Ja> })}
      </p>
      <TutorNote />
    </div>
  );
}

/**
 * The AI tutor (P6): what it does, how to get a Gemini key, then the key field and models.
 * Without a key the step's button reads Skip; everything but the tutor works without one.
 */
export function StepAi({ settings, patch }: Pick<StepProps, 'settings' | 'patch'>) {
  const { t } = useI18n();
  const AiSetup = useSlot('aiSetup');
  return (
    <>
      <StepHeading>{t('onboarding.aiHeading')}</StepHeading>
      <Lead>{t('onboarding.aiLead')}</Lead>
      <Demo />
      <KeyHelp />
      {AiSetup && <AiSetup settings={settings} onPatch={patch} />}
      <Note>{t('onboarding.skipAiHint')}</Note>
    </>
  );
}
