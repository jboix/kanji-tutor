/**
 * No-spoil for the explain screens (L3): while targets of the card are still to be answered,
 * every tutor output shown under this provider (the word sheet, its breakdown, a free question,
 * follow-ups, a mistake note), cached ones too, goes through `redactOutput`, and a dictionary
 * reading that is a hidden one is not shown.
 */
import { createContext, type ReactNode, use, useEffect, useMemo, useState } from 'react';
import { type HiddenReading, isHiddenReading, redactOutput } from '../../ai/index.ts';
import { hiddenNow, hiddenTargets } from '../../domain/services/index.ts';
import type { SessionCard } from '../../domain/session-types.ts';
import type { Sentence } from '../../domain/types.ts';
import { knownFurigana, useAllFurigana } from '../../ui/furigana-mode.tsx';
import { useServices } from '../../ui/services.tsx';

export interface NoSpoilFilter {
  /** The value with every hidden reading removed; the value itself when nothing is hidden. */
  clean: <T>(value: T) => T;
  /** True when a reading (the dictionary's or the tokenizer's) is one still to be answered. */
  hides: (reading: string) => boolean;
}

const NOTHING_HIDDEN: NoSpoilFilter = { clean: (value) => value, hides: () => false };

const NoSpoilContext = createContext<NoSpoilFilter>(NOTHING_HIDDEN);

/** The targets of `card` from `from` on: accepted readings at once, dictionary ones once loaded. */
function useHidden(card: SessionCard | undefined, from: number): readonly HiddenReading[] {
  const { repos } = useServices();
  const now = useMemo(() => (card ? hiddenNow(card, from) : []), [card, from]);
  const [loaded, setLoaded] = useState<{ key: unknown; hidden: HiddenReading[] }>();
  useEffect(() => {
    if (!card || now.length === 0) return;
    let live = true;
    void hiddenTargets(repos, card, from).then(
      (hidden) => live && setLoaded({ key: now, hidden }),
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [repos, card, from, now]);
  return loaded?.key === now ? loaded.hidden : now;
}

/** Filters what the children show while targets of `card` from `from` on are not answered. */
export function NoSpoilProvider(props: {
  card?: SessionCard | undefined;
  from: number;
  children: ReactNode;
}) {
  const hidden = useHidden(props.card, props.from);
  const sentence = props.card?.sentence.text ?? '';
  const filter = useMemo<NoSpoilFilter>(() => {
    if (hidden.length === 0) return NOTHING_HIDDEN;
    return {
      clean: (value) => redactOutput(value, { hidden, sentence }),
      hides: (reading) => isHiddenReading(reading, hidden),
    };
  }, [hidden, sentence]);
  return <NoSpoilContext value={filter}>{props.children}</NoSpoilContext>;
}

/** The filter of the nearest `NoSpoilProvider`; nothing is hidden outside one. */
export function useNoSpoil(): NoSpoilFilter {
  return use(NoSpoilContext);
}

/** With ふ on (R12): furigana on the sheet's sentence, none on a reading still to be answered. */
export function useContextFurigana(sentence: Sentence): number[] {
  const all = useAllFurigana();
  const { hides } = useNoSpoil();
  return all ? knownFurigana(sentence.tokens, (_, token) => hides(token.reading)) : [];
}
