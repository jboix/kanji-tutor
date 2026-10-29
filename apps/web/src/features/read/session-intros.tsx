/**
 * Intros a session no longer shows (L7): with "Explain new grammar first" unticked during the
 * session, a grammar intro still ahead is passed over and its point goes on the next card that
 * exercises it, as a "New grammar" chip; with "Explain new kanji first" off, the "New" chips.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { exercisesGrammar } from '../../domain/services/index.ts';
import { NewChips } from './new-chips.tsx';
import { current, currentCard } from './session-state.ts';
import type { SessionControls } from './use-session.ts';

type State = SessionControls['state'];

/** Grammar intros passed over, and the points whose chip the current card shows. */
export function useSkippedGrammar(state: State, finishIntro: () => void) {
  const [chipAt, setChipAt] = useState<Readonly<Record<string, number>>>({});
  const { cards, index } = state;
  const skip = useCallback(
    (id: string) => {
      const at = cards?.findIndex((card, i) => i > index && exercisesGrammar(card, id)) ?? -1;
      if (at >= 0) setChipAt((was) => ({ ...was, [id]: at }));
      finishIntro();
    },
    [cards, index, finishIntro],
  );
  const ids = Object.keys(chipAt).filter((id) => chipAt[id] === index);
  return { ids, skip };
}

/** Passes over a grammar intro card once, as soon as it is reached. */
export function SkipIntro({ onSkip }: { onSkip: () => void }) {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    onSkip();
  }, [onSkip]);
  return null;
}

interface CardChipsProps {
  state: State;
  /** The "New" chip of a word met for the first time, when its intro is not shown first. */
  words: boolean;
  /** Grammar points whose intro was passed over, for their chips on this card. */
  grammar: readonly string[];
}

/** The current card's "New" chips for its help bar (L7). */
export function CardChips({ state, words, grammar }: CardChipsProps) {
  const card = currentCard(state);
  if (!card) return null;
  const answered = state.answered !== undefined;
  const key = `${state.index}:${state.step}`;
  const target = words ? current(state)?.target : undefined;
  return (
    <NewChips
      key={key}
      card={card}
      target={target}
      answered={answered}
      grammar={[...(card.newGrammar ?? []), ...grammar]}
    />
  );
}
