/**
 * The session's ふ toggle (R4, R12): furigana on known words too. The read screen provides it
 * around everything the session shows, so the intro and teaching cards, exercises and sheets
 * follow it, not only the sentence. Outside a session it is off.
 */
import { createContext, use } from 'react';
import type { Token } from '../domain/types.ts';
import { hasKanji } from './furigana.ts';

export const AllFuriganaContext = createContext(false);

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
