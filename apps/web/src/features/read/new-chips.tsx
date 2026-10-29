/**
 * "New" chips (L7, L8): with explanations skipped, an exercise shows "New: 学生" for a word never
 * met (the teach slot) and "New grammar: 〜です" for a grammar point it is the first to use. Each
 * opens the intro in a sheet, and nothing counts against the answer.
 */
import { useEffect, useState } from 'react';
import { GRAMMAR_CATALOGUE } from '../../domain/grammar/index.ts';
import { introduceGrammar } from '../../domain/services/index.ts';
import type { SessionCard, Target } from '../../domain/session-types.ts';
import { BottomSheet } from '../../ui/bottom-sheet.tsx';
import { Chip } from '../../ui/chip.tsx';
import { useI18n } from '../../ui/i18n/i18n.tsx';
import { Ja } from '../../ui/ja.tsx';
import { useServices } from '../../ui/services.tsx';
import { useSlot } from '../../ui/slots.tsx';

/**
 * One new grammar point's chip. Meeting the point here counts as its introduction, as "Got it"
 * does on the intro card, so it joins FSRS and is not new again next time.
 */
function GrammarChip({ grammarId }: { grammarId: string }) {
  const { t, rich } = useI18n();
  const { repos } = useServices();
  const Intro = useSlot('grammarIntro');
  const [open, setOpen] = useState(false);
  useEffect(() => {
    void introduceGrammar(repos, grammarId, Date.now());
  }, [repos, grammarId]);
  const pattern = GRAMMAR_CATALOGUE.find((e) => e.id === grammarId)?.pattern ?? grammarId;
  return (
    <>
      <Chip onClick={() => setOpen(true)} data-new-chip="grammar">
        {rich('read.newGrammarChip', { pattern: <Ja>{pattern}</Ja> })}
      </Chip>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        label={t('read.newGrammarLabel', { pattern })}
      >
        {Intro && <Intro grammarId={grammarId} onDone={() => setOpen(false)} />}
      </BottomSheet>
    </>
  );
}

export interface NewChipsProps {
  card: SessionCard;
  /** The target being read, on a reading card. */
  target?: Target | undefined;
  answered?: boolean;
  /** The new grammar points to chip: the card's own, and any whose intro was passed over. */
  grammar?: readonly string[] | undefined;
}

export function NewChips({ card, target, answered = false, grammar }: NewChipsProps) {
  const WordChip = useSlot('newWordChip');
  return (
    <>
      {WordChip && target && (
        <WordChip key={target.itemId} card={card} target={target} answered={answered} />
      )}
      {(grammar ?? card.newGrammar ?? []).map((id) => (
        <GrammarChip key={id} grammarId={id} />
      ))}
    </>
  );
}
