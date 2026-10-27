/**
 * The session's ふ toggle (R4, R12): furigana on known words too. The read screen provides it
 * around everything the session shows, so the intro and teaching cards, exercises and sheets
 * follow it, not only the sentence. A unit's episode has its own ふ; elsewhere it is off.
 */
import { createContext, use, useEffect, useState } from 'react';
import type { Token } from '../domain/types.ts';
import { hasKanji } from './furigana.ts';
import { useServices } from './services.tsx';

export const AllFuriganaContext = createContext(false);

/** The ふ toggle's state: it starts from the furigana setting ("all words" turns it on). */
export function useFuriganaToggle(): [boolean, () => void] {
  const { repos } = useServices();
  const [all, setAll] = useState(false);
  useEffect(() => {
    void repos.settings.get().then((settings) => setAll(settings.furigana === 'all'));
  }, [repos]);
  return [all, () => setAll((on) => !on)];
}

/** True while ふ is on. */
export function useAllFurigana(): boolean {
  return use(AllFuriganaContext);
}

/**
 * With ふ on, every token written with kanji gets furigana except the shut ones (a target still
 * to be answered, a blank's pieces): `shut` is asked with the token's index.
 */
export function knownFurigana(
  tokens: readonly Token[],
  shut: (index: number, token: Token) => boolean,
): number[] {
  return tokens.flatMap((token, i) => (hasKanji(token.surface) && !shut(i, token) ? [i] : []));
}
