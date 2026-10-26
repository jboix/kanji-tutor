/**
 * The word of the season (Home), pure: which word a date falls in, the season it is in by the
 * old calendar (spring from 立春 on 4 February, summer from 立夏, autumn from 立秋, winter from
 * 立冬), early, mid or late, and its example as tokens for the word sheet.
 */
import { SEASON_WORDS, type SeasonWord, WORD } from './season-words.ts';
import type { Token } from './types.ts';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type SeasonPhase = 'early' | 'mid' | 'late';

/** Each season's thirds start on these days: early, mid, late. */
const THIRDS: readonly (readonly [Season, readonly (readonly [number, number])[]])[] = [
  [
    'spring',
    [
      [2, 4],
      [3, 6],
      [4, 5],
    ],
  ],
  [
    'summer',
    [
      [5, 6],
      [6, 6],
      [7, 7],
    ],
  ],
  [
    'autumn',
    [
      [8, 8],
      [9, 8],
      [10, 8],
    ],
  ],
  [
    'winter',
    [
      [11, 7],
      [12, 7],
      [1, 6],
    ],
  ],
];
const PHASES: readonly SeasonPhase[] = ['early', 'mid', 'late'];

/** A month and day as one comparable number, 101 to 1231. */
const dayKey = ([month, day]: readonly [number, number]) => month * 100 + day;

/** The last of `starts` on or before `key`; the last of all when `key` is before the first. */
function lastFrom<T>(starts: readonly (readonly [number, T])[], key: number): T | undefined {
  const sorted = [...starts].sort((a, b) => a[0] - b[0]);
  const found = sorted.filter(([start]) => start <= key).at(-1) ?? sorted.at(-1);
  return found?.[1];
}

export interface SeasonNow {
  word: SeasonWord;
  season: Season;
  phase: SeasonPhase;
}

/** The season word and season of the local date `now`. */
export function seasonAt(now: number): SeasonNow | undefined {
  const date = new Date(now);
  const key = dayKey([date.getMonth() + 1, date.getDate()]);
  const word = lastFrom(
    SEASON_WORDS.map((entry) => [dayKey(entry.from), entry] as const),
    key,
  );
  const third = lastFrom(
    THIRDS.flatMap(([season, starts]) =>
      starts.map((start, i) => [dayKey(start), { season, phase: PHASES[i] ?? 'early' }] as const),
    ),
    key,
  );
  return word && third ? { word, ...third } : undefined;
}

const PUNCTUATION = /^[。、！？「」]+$/;

function tokenOf(piece: string | readonly [string, string], start: number): Token {
  if (typeof piece !== 'string') {
    const [surface, reading] = piece;
    return { surface, reading, base: surface, pos: 'noun', start };
  }
  const pos = PUNCTUATION.test(piece) ? 'symbol' : 'other';
  return { surface: piece, reading: piece, base: piece, pos, start };
}

/** The example as text and tokens, the season word resolved to `wordId`; and the word's index. */
export function seasonExample(word: SeasonWord, wordId: string | undefined) {
  const tokens: Token[] = [];
  let text = '';
  let index = 0;
  for (const piece of word.example) {
    const token =
      piece === WORD
        ? {
            surface: word.written,
            reading: word.reading,
            base: word.written,
            pos: 'noun',
            start: text.length,
            ...(wordId ? { wordId } : {}),
          }
        : tokenOf(piece, text.length);
    if (piece === WORD) index = tokens.length;
    tokens.push(token);
    text += token.surface;
  }
  return { text, tokens, index };
}
