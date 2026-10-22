/**
 * The "New: 学生" chip (L7): with explanations skipped, the exercise of a word never met shows
 * this chip instead of an intro card first. It opens the intro in a sheet, and pressing it does
 * not count against the answer. Before the answer the sheet is the L2 hint, without the reading;
 * after it, the whole intro.
 */
import { useEffect, useState } from 'react';
import { answerSpan } from '../../domain/services/index.ts';
import { BottomSheet } from '../../ui/bottom-sheet.tsx';
import { Chip } from '../../ui/chip.tsx';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { RuledSentence } from '../../ui/ruled-sentence.tsx';
import { useServices } from '../../ui/services.tsx';
import type { NewWordChipSlotProps } from '../../ui/slots.tsx';
import { introDue } from './intro-once.ts';
import { MemoryHookView, PartsHooks } from './memory-hook.tsx';
import styles from './teach.module.css';
import { TeachingContent } from './teaching-content.tsx';
import { useTeaching } from './use-teaching.ts';

/** Whether the word is new, checked once per target: answering it must not hide the chip. */
function useNew(itemId: NewWordChipSlotProps['target']['itemId']): boolean {
  const { repos } = useServices();
  const [fresh, setFresh] = useState(false);
  useEffect(() => {
    let live = true;
    void introDue(repos, itemId).then((yes) => {
      if (live) setFresh(yes);
    });
    return () => {
      live = false;
    };
  }, [repos, itemId]);
  return fresh;
}

function Body({ card, target, answered }: NewWordChipSlotProps) {
  const { t } = useI18n();
  const teaching = useTeaching(card, target);
  if (!teaching) return <p className={styles.muted}>{t('teach.lookingUp')}</p>;
  const hook = answered ? (
    <MemoryHookView teaching={teaching} sentence={card.sentence.text} />
  ) : (
    <PartsHooks hooks={teaching.hooks} />
  );
  return <TeachingContent teaching={teaching} readings={answered} why={answered} hook={hook} />;
}

export function NewWordChip(props: NewWordChipSlotProps) {
  const { t, rich } = useI18n();
  const [open, setOpen] = useState(false);
  const fresh = useNew(props.target.itemId);
  if (!fresh) return null;
  const { card, target } = props;
  const span = answerSpan(card.sentence, target.tokenIndex);
  const word = <Ja>{target.surface}</Ja>;
  return (
    <>
      <Chip onClick={() => setOpen(true)} data-new-chip="word">
        {rich('teach.newChip', { word })}
      </Chip>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t('teach.newWordLabel', { surface: target.surface })}
        context={<RuledSentence sentence={card.sentence} size="context" target={span} />}
      >
        <div className={styles.card}>
          <Body {...props} />
        </div>
      </BottomSheet>
    </>
  );
}
