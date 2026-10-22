/**
 * What a captured page asks of the learner (C2, C3): how much of it they can read today, and
 * which words are new. Uses the same content-token rules as the session selector.
 */
import { hasKanji, toKanaFold } from '../kana.ts';
import type { Repos } from '../repos.ts';
import { FUNCTION_POS, KNOWN_LEVEL } from '../selector.ts';
import type { WordLevels } from '../session-types.ts';
import type { Item, Token, Word } from '../types.ts';

/** Share of a text's content tokens the learner can read (level ≥ 3). */
export interface Readiness {
  known: number;
  total: number;
  /** 0 to 1; a text with no kanji words is fully readable. */
  ratio: number;
}

/** A word the learner could add from a capture, with its reading and gloss from JMdict. */
export interface CandidateWord {
  wordId: string;
  /** Dictionary form as written in the text, e.g. 減る for 減っ. */
  text: string;
  /** From the dictionary, never from the model, so it is verified by construction. */
  reading: string;
  /** The first English gloss. */
  gloss: string;
  /** First glosses in other languages, from installed language packs (N9). */
  glossByLang?: Record<string, string>;
}

/** One captured line, analysed. */
export interface AnalysedLine {
  text: string;
  tokens: Token[];
  /** Indices of the content tokens the learner cannot read yet. */
  unknown: number[];
}

export interface CaptureAnalysis {
  lines: AnalysedLine[];
  readiness: Readiness;
  /** Untracked words below level 3, in order of first appearance. */
  words: CandidateWord[];
}

/** True for tokens that count: written with kanji and not a particle, auxiliary or symbol. */
function isContent(token: Token): boolean {
  return !FUNCTION_POS.has(token.pos) && hasKanji(token.surface);
}

function isKnown(token: Token, levels: WordLevels): boolean {
  return token.wordId !== undefined && (levels.get(token.wordId) ?? 0) >= KNOWN_LEVEL;
}

/** Indices of the content tokens the learner cannot read yet (level < 3 or unresolved). */
export function unknownIndices(tokens: readonly Token[], levels: WordLevels): number[] {
  return tokens.flatMap((token, i) => (isContent(token) && !isKnown(token, levels) ? [i] : []));
}

/** Readiness of a text (C2): known content tokens over all content tokens. */
export function readiness(tokens: readonly Token[], levels: WordLevels): Readiness {
  const content = tokens.filter(isContent);
  const known = content.filter((token) => isKnown(token, levels)).length;
  const total = content.length;
  return { known, total, ratio: total === 0 ? 1 : known / total };
}

/** The dictionary form and reading that fit the token best. */
function candidateFor(token: Token, word: Word): CandidateWord {
  const text = word.forms.find((form) => form === token.base) ?? word.forms[0] ?? token.base;
  const asWritten = token.surface === token.base ? toKanaFold(token.reading) : undefined;
  const reading =
    word.readings.find((r) => asWritten !== undefined && toKanaFold(r) === asWritten) ??
    word.readings[0] ??
    '';
  const local = Object.entries(word.glossesByLang ?? {}).flatMap(([lang, glosses]) =>
    glosses[0] ? [[lang, glosses[0]] as const] : [],
  );
  const base = { wordId: word.id, text, reading, gloss: word.glosses[0] ?? '' };
  return local.length > 0 ? { ...base, glossByLang: Object.fromEntries(local) } : base;
}

/** First token of each untracked unknown word, in text order. */
function newWordTokens(lines: readonly AnalysedLine[], tracked: ReadonlySet<string>): Token[] {
  const seen = new Map<string, Token>();
  for (const line of lines) {
    for (const i of line.unknown) {
      const token = line.tokens[i];
      const id = token?.wordId;
      if (token && id !== undefined && !tracked.has(id) && !seen.has(id)) seen.set(id, token);
    }
  }
  return [...seen.values()];
}

async function candidateWords(
  repos: Repos,
  lines: readonly AnalysedLine[],
  tracked: ReadonlySet<string>,
): Promise<CandidateWord[]> {
  const tokens = newWordTokens(lines, tracked);
  const words = await repos.dictionary.words(tokens.map((token) => token.wordId ?? ''));
  return tokens.flatMap((token, i) => {
    const word = words[i];
    return word ? [candidateFor(token, word)] : [];
  });
}

function levelsOf(items: readonly Item[]): Map<string, Item['level']> {
  return new Map(items.map((item) => [item.ref, item.level]));
}

/**
 * Analyses tokenized lines against the learner's word items: per-line unknown tokens, overall
 * readiness, and the new words to propose, with readings and glosses from the dictionary (C3).
 */
export async function analyseCapture(
  repos: Repos,
  lines: readonly { text: string; tokens: Token[] }[],
): Promise<CaptureAnalysis> {
  const items = await repos.items.byKind('word');
  const levels = levelsOf(items);
  const analysed = lines.map((line) => ({ ...line, unknown: unknownIndices(line.tokens, levels) }));
  const tracked = new Set(items.map((item) => item.ref));
  return {
    lines: analysed,
    readiness: readiness(
      lines.flatMap((line) => line.tokens),
      levels,
    ),
    words: await candidateWords(repos, analysed, tracked),
  };
}

const JAPANESE_RUN = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー〜]+/gu;
const KANA_ONLY = /^[\p{Script=Hiragana}ー]+$/u;

/**
 * Kana phrases (three characters or more) that an AI explanation quotes from the line, longest
 * first, e.g. わけではない. They are grammar patterns the explanation is about, so the screen can
 * underline them and offer them as grammar points marked as coming from AI.
 */
export function citedPhrases(explanation: string, line: string): string[] {
  const runs = (explanation.match(JAPANESE_RUN) ?? []).map((run) => run.replace(/^〜/u, ''));
  const cited = runs.filter((run) => run.length >= 3 && KANA_ONLY.test(run) && line.includes(run));
  return [...new Set(cited)].sort((a, b) => b.length - a.length);
}
