import { useEffect, useState } from 'react';
import { answerSpan } from '../../domain/services/index.ts';
import { useT } from '../../ui/i18n/i18n.tsx';
import { PillButton } from '../../ui/pill-button.tsx';
import { SectionLabel } from '../../ui/section-label.tsx';
import { useServices } from '../../ui/services.tsx';
import type { IntroSlotProps, TeachingSlotProps } from '../../ui/slots.tsx';
import { StickyActions } from '../../ui/sticky-actions.tsx';
import { TapSentence } from '../../ui/word-tap.tsx';
import { introDue, markIntroduced } from './intro-once.ts';
import { MemoryHookView, PartsHooks } from './memory-hook.tsx';
import styles from './teach.module.css';
import { TeachingContent } from './teaching-content.tsx';
import { useTeaching } from './use-teaching.ts';

/** Whether the intro is due for this target: undefined while checking (L1). */
function useDue({ target, onDone }: IntroSlotProps): boolean | undefined {
  const { repos } = useServices();
  const [due, setDue] = useState<boolean>();
  useEffect(() => {
    let live = true;
    void introDue(repos, target.itemId).then((yes) => {
      if (!live) return;
      setDue(yes);
      if (!yes) onDone();
    });
    return () => {
      live = false;
    };
  }, [repos, target.itemId, onDone]);
  return due;
}

/** The card's other targets, still to be read: shut, as in the session. */
function laterTargets(card: IntroSlotProps['card'], target: IntroSlotProps['target']): number[] {
  return card.targets
    .filter((t) => t.tokenIndex !== target.tokenIndex)
    .flatMap((t) => answerSpan(card.sentence, t.tokenIndex));
}

function IntroCard({ card, target, onDone }: IntroSlotProps) {
  const t = useT();
  const teaching = useTeaching(card, target);
  if (!teaching) return null;
  const gotIt = () => {
    markIntroduced(target.itemId);
    onDone();
  };
  return (
    <section
      className={styles.card}
      aria-label={t('teach.newWordLabel', { surface: teaching.surface })}
    >
      <SectionLabel as="h2">{t('teach.newWord')}</SectionLabel>
      <TapSentence
        sentence={card.sentence}
        size="callout"
        target={answerSpan(card.sentence, target.tokenIndex)}
        // The intro teaches the reading this sentence gives the word (R15).
        furigana={answerSpan(card.sentence, target.tokenIndex)}
        locked={laterTargets(card, target)}
        beforeAnswer
      />
      <TeachingContent
        teaching={teaching}
        readings
        hook={<MemoryHookView teaching={teaching} sentence={card.sentence.text} />}
      />
      <StickyActions>
        <PillButton block onClick={gotIt}>
          {t('teach.gotIt')}
        </PillButton>
      </StickyActions>
    </section>
  );
}

/**
 * Before the first exercise on a word the learner has never met (L1): the word, its reading and
 * meaning, its kanji and parts, why it is here and a memory hook. "Got it" goes on to the
 * exercise; a word met before goes straight on, and no intro shows twice.
 */
export function NewItemIntro(props: IntroSlotProps) {
  const due = useDue(props);
  return due ? <IntroCard {...props} /> : null;
}

/**
 * The same teaching under a skip or a miss, so a skip teaches too (L1, L4). Static only: no AI
 * fires here, the hook is the one built from the parts.
 */
export function TeachingCard({ card, target }: TeachingSlotProps) {
  const t = useT();
  const teaching = useTeaching(card, target);
  if (!teaching) return null;
  return (
    <section
      className={`${styles.card} ${styles.under}`}
      aria-label={t('teach.about', { surface: teaching.surface })}
    >
      <TeachingContent teaching={teaching} readings hook={<PartsHooks hooks={teaching.hooks} />} />
    </section>
  );
}
