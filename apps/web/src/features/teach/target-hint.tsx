import { answerSpan } from '../../domain/services/index.ts';
import { BottomSheet } from '../../ui/bottom-sheet.tsx';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { RuledSentence } from '../../ui/ruled-sentence.tsx';
import type { HintSlotProps } from '../../ui/slots.tsx';
import { PartsHooks } from './memory-hook.tsx';
import styles from './teach.module.css';
import { TeachingContent } from './teaching-content.tsx';
import { useTeaching } from './use-teaching.ts';
import type { WordTeaching } from './word-teaching.ts';

/**
 * A hint for a target not answered yet (L2): its meaning, part of speech, its kanji's meanings and
 * parts, and the parts hook. Never the reading: no kana, furigana, romaji or example words.
 * "Show the reading" is the session's skip, so it counts as "I don't know".
 */
function ShowReading({ onShow }: { onShow: () => void }) {
  const t = useT();
  return (
    <div className={styles.actions}>
      <PillButton variant="secondary" block onClick={onShow}>
        {t('teach.showReading')}
      </PillButton>
      <p className={styles.muted}>{t('teach.showReadingNote')}</p>
    </div>
  );
}

/** The hint's teaching, without readings or "why it's here", once loaded. */
function HintTeaching({ teaching }: { teaching: WordTeaching | undefined }) {
  const t = useT();
  if (!teaching) return <p className={styles.muted}>{t('teach.lookingUp')}</p>;
  return (
    <TeachingContent
      teaching={teaching}
      readings={false}
      why={false}
      hook={<PartsHooks hooks={teaching.hooks} />}
    />
  );
}

export function TargetHint({ card, target, onShowReading, onClose }: HintSlotProps) {
  const t = useT();
  const teaching = useTeaching(card, target);
  const span = answerSpan(card.sentence, target.tokenIndex);
  const surface = span.map((i) => card.sentence.tokens[i]?.surface ?? '').join('');
  const show =
    onShowReading &&
    (() => {
      onClose();
      onShowReading();
    });
  return (
    <BottomSheet
      open
      onClose={onClose}
      label={t('teach.hintFor', { surface })}
      context={<RuledSentence sentence={card.sentence} size="context" target={span} />}
    >
      <div className={styles.card}>
        <HintTeaching teaching={teaching} />
        {show && <ShowReading onShow={show} />}
      </div>
    </BottomSheet>
  );
}
