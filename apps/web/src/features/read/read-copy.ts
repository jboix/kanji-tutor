/** Plain copy for the reading session: feedback labels and the session labels (M3). */
import type { ErrorType } from '../../domain/types.ts';
import type { PlainKey, Translate } from '../../ui/i18n/types.ts';

/** Short names of near-miss slips, for "Expected まって · small っ". */
export const SLIP: Partial<Record<ErrorType, PlainKey>> = {
  'long-vowel': 'readSession.slipLongVowel',
  sokuon: 'readSession.slipSokuon',
  rendaku: 'readSession.slipRendaku',
};

/** The expected reading split around the part that differs from the answer (しょ|う|かい). */
export function diffParts(expected: string, given: string): [string, string, string] {
  let start = 0;
  while (start < expected.length && expected[start] === given[start]) start++;
  let end = 0;
  const room = Math.min(expected.length, given.length) - start;
  while (end < room && expected.at(-1 - end) === given.at(-1 - end)) end++;
  return [
    expected.slice(0, start),
    expected.slice(start, expected.length - end),
    expected.slice(expected.length - end),
  ];
}

/** The prompt above each kind of drill. */
export const DRILL_PROMPT = {
  lookalike: 'drills.promptLookalike',
  cloze: 'drills.promptCloze',
  readings: 'drills.promptReadings',
  family: 'drills.promptFamily',
} as const satisfies Record<string, PlainKey>;

/**
 * Session labels in Japanese and in the learner's language (M3), for the immersion mode: today's
 * copy when native, Japanese with the native label as a small subtitle when Japanese, and both
 * side by side when mixed. `native` is a message key: the label in the learner's language (N7b).
 */
export const SESSION_COPY = {
  prompt: { ja: '読み方は？', native: 'readSession.prompt' },
  right: { ja: '正解', native: 'readSession.right' },
  readAs: { ja: '読み方', native: 'readSession.readAs' },
  youWrote: { ja: 'あなたの答え', native: 'readSession.youWrote' },
  expected: { ja: '正しい読み方', native: 'readSession.expected' },
  skip: { ja: '分からない', native: 'readSession.skip' },
  hereItIs: { ja: '答え', native: 'readSession.hereItIs' },
  nextWord: { ja: '次へ', native: 'readSession.nextWord' },
  nextSentence: { ja: '次の文へ', native: 'readSession.nextSentence' },
} as const satisfies Record<string, { ja: string; native: PlainKey }>;

export type CopyKey = keyof typeof SESSION_COPY;

/** The mode the session copy follows (M1, M3). */
export type CopyMode = 'native' | 'mixed' | 'japanese';

/** A label as shown: the main text, and the native one under it in Japanese mode. */
export interface SessionLabel {
  main: string;
  ja: boolean;
  sub?: string;
  /** Mixed mode: the learner's label after the Japanese one, in the interface font. */
  after?: string;
}

/** What a session label shows in a mode (M3). */
export function sessionLabel(t: Translate, key: CopyKey, mode: CopyMode): SessionLabel {
  const { ja } = SESSION_COPY[key];
  const native = t(SESSION_COPY[key].native);
  if (mode === 'native') return { main: native, ja: false };
  if (mode === 'mixed') return { main: ja, ja: true, after: native };
  return { main: ja, ja: true, sub: native };
}

/** A label as plain text, for attributes such as a placeholder. */
export function sessionText(t: Translate, key: CopyKey, mode: CopyMode): string {
  const { main, sub, after } = sessionLabel(t, key, mode);
  if (after) return `${main} · ${after}`;
  return sub ? `${main} (${sub})` : main;
}
