/**
 * The teaching under a question or drill answer that was not right (L4, issue 40): the word's
 * teaching card for a word item, a compact "about this grammar" for a grammar point. Nothing for
 * a right answer, or for an item with no card of its own (a kanji reading).
 */
import { useMemo } from 'react';
import { parseItemId } from '../../domain/ids.ts';
import type { SessionCard, Target } from '../../domain/session-types.ts';
import type { Grade, ItemId } from '../../domain/types.ts';
import { useSlot } from '../../ui/slots.tsx';

export interface ItemTeachingProps {
  /** The session card the exercise sits on; a word's teaching needs it. */
  card: SessionCard | undefined;
  itemId: ItemId | undefined;
  /** The word as the exercise shows it, when the dictionary has no form. */
  surface?: string | undefined;
  grade: Grade | undefined;
}

const noop = () => undefined;

interface WordProps {
  card: SessionCard;
  itemId: ItemId;
  wordId: string;
  surface: string;
  grade: Grade;
}

function WordTeaching({ card, itemId, wordId, surface, grade }: WordProps) {
  const Teaching = useSlot('teachingCard');
  // Stable objects: the teaching loads again whenever its card or target changes.
  const shown = useMemo(() => {
    const target: Target = { tokenIndex: -1, itemId, wordId, surface, readings: [] };
    return { card: { ...card, targets: [target] }, target };
  }, [card, itemId, wordId, surface]);
  return Teaching ? <Teaching card={shown.card} target={shown.target} grade={grade} /> : null;
}

function GrammarAbout({ grammarId }: { grammarId: string }) {
  const Intro = useSlot('grammarIntro');
  return Intro ? <Intro grammarId={grammarId} onDone={noop} compact /> : null;
}

export function ItemTeaching({ card, itemId, surface = '', grade }: ItemTeachingProps) {
  if (!grade || grade.verdict === 'correct' || !itemId) return null;
  const { kind, ref } = parseItemId(itemId);
  if (kind === 'grammar') return <GrammarAbout grammarId={ref} />;
  if (kind !== 'word' || !card) return null;
  return <WordTeaching card={card} itemId={itemId} wordId={ref} surface={surface} grade={grade} />;
}
