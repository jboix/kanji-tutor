/**
 * The immersion post-check (M2, D51). After a mixed or Japanese explanation is generated, its
 * Japanese is tokenized and every content word is looked up in the learner's progress:
 *
 * - a word above the learner (not known, and never met or harder than their level) gets
 *   furigana from the tokenizer's reading, checked with `verifyReading`, and a dictionary gloss
 *   for tap-to-gloss;
 * - a reading that would give away a target still to be answered (L3) is left out;
 * - when more than 15% of the content words are above the learner, the reply falls back to
 *   mixed: the summary in the learner's language is shown after the Japanese, marked.
 */
import type { KnownCheck, KnownState, LearnerView } from '../domain/learner-view.ts';
import type { Token } from '../domain/types.ts';
import type { ImmersionPlan } from './immersion.ts';
import { type HiddenReading, redactReadings, spoilsReading } from './no-spoil.ts';
import type { Verifier } from './task-def.ts';
import type { GlossedWord, GlossPlace, ImmersionNote } from './types.ts';
import { checkReading } from './verify.ts';

/** Above this share of unknown content words, the reply falls back to mixed. */
export const FALLBACK_SHARE = 0.15;
/** Words glossed per reply at most; the rest still count towards the share. */
const MAX_GLOSSED = 12;
/** `check_known` answers at most 30 words per call. */
const CHECK_BATCH = 30;

const FUNCTION_POS: ReadonlySet<string> = new Set(['particle', 'auxiliary', 'symbol']);
const HAN = /\p{Script=Han}/u;

/** A content word: not a particle, auxiliary or symbol, and written with kanji (as in R2). */
export function isContentToken(token: Pick<Token, 'pos' | 'surface'>): boolean {
  return !FUNCTION_POS.has(token.pos) && HAN.test(token.surface);
}

/** What the learner's progress is looked up by: the dictionary form when it has kanji. */
export function lookupKey(token: Pick<Token, 'base' | 'surface'>): string {
  return HAN.test(token.base) ? token.base : token.surface;
}

/** A word's state for the learner, as `check_known` gives it. */
export interface WordState {
  state: KnownState;
  jlpt?: number;
}

/** Not known, and either never met or harder than the learner's level (N3 is harder than N4). */
export function aboveLearner(word: WordState | undefined, level: number): boolean {
  if (!word || word.state === 'unseen') return true;
  if (word.state === 'known') return false;
  return word.jlpt === undefined || word.jlpt < level;
}

/** The content words, and those above the learner, each once in order of appearance. */
export function classifyTokens(
  tokens: readonly Token[],
  states: ReadonlyMap<string, WordState>,
  level: number,
): { content: number; aboveCount: number; above: Token[] } {
  const content = tokens.filter(isContentToken);
  const aboveAll = content.filter((token) => aboveLearner(states.get(lookupKey(token)), level));
  const unique = new Map(aboveAll.map((token) => [token.surface, token]));
  return { content: content.length, aboveCount: aboveAll.length, above: [...unique.values()] };
}

/** True when too much of the Japanese is above the learner (more than 15% of content words). */
export function shouldFallBack(aboveCount: number, content: number): boolean {
  return content > 0 && aboveCount / content > FALLBACK_SHARE;
}

/** What the post-check needs beyond the reply. */
export interface PostCheckDeps {
  lang: Verifier;
  learner?: LearnerView;
}

async function statesOf(learner: LearnerView, keys: readonly string[]) {
  const batches: string[][] = [];
  for (let at = 0; at < keys.length; at += CHECK_BATCH) {
    batches.push(keys.slice(at, at + CHECK_BATCH));
  }
  const checks = (await Promise.all(batches.map((words) => learner.checkKnown({ words })))).flat();
  const word = (check: KnownCheck): WordState =>
    check.jlpt === undefined ? { state: check.state } : { state: check.state, jlpt: check.jlpt };
  return new Map(checks.map((check) => [check.text, word(check)]));
}

async function glossOf(learner: LearnerView, token: Token): Promise<string | undefined> {
  try {
    return (await learner.lookupWord(lookupKey(token)))[0]?.meanings[0];
  } catch {
    return undefined;
  }
}

/** Furigana and gloss for one word; no reading when it would spoil a hidden target. */
async function glossed(
  deps: Required<PostCheckDeps>,
  token: Token,
  hidden: readonly HiddenReading[],
): Promise<GlossedWord> {
  const gloss = await glossOf(deps.learner, token);
  const base: GlossedWord = { surface: token.surface, verified: false };
  if (gloss) base.gloss = gloss;
  const claim = { surface: token.surface, reading: token.reading };
  if (token.reading === '' || spoilsReading(claim, hidden)) return base;
  const checked = await checkReading(deps.lang, claim);
  return { ...base, reading: checked.reading, verified: checked.verified };
}

/** The Japanese texts and their tokens, text by text. */
async function tokensOf(lang: Verifier, texts: readonly string[]) {
  const tokenize = lang.tokenize;
  const japanese = texts.filter((text) => HAN.test(text));
  if (!tokenize) return { japanese, perText: [] as Token[][] };
  return { japanese, perText: await Promise.all(japanese.map((text) => tokenize(text))) };
}

/**
 * Where each glossed word is, by the tokenizer's offsets (D57): a token whose surface is a glossed
 * word and sits at its `start` in the text. 日 inside 毎日 is one token 毎日, so it never gets ひ.
 */
export function glossPlaces(
  texts: readonly string[],
  perText: readonly (readonly Token[])[],
  words: readonly GlossedWord[],
): GlossPlace[] {
  const index = new Map(words.map((word, i) => [word.surface, i]));
  return perText.flatMap((tokens, text) =>
    tokens.flatMap((token) => {
      const word = index.get(token.surface);
      const end = token.start + token.surface.length;
      const there = texts[text]?.slice(token.start, end) === token.surface;
      return word !== undefined && there ? [{ text, start: token.start, end, word }] : [];
    }),
  );
}

/** The note when nothing could be checked: no tokenizer, no learner view, or a failure. */
function unchecked(plan: ImmersionPlan, summary: string | undefined): ImmersionNote {
  const note: ImmersionNote = {
    mode: plan.mode,
    words: [],
    unknownShare: 0,
    fellBack: false,
    checked: false,
  };
  if (summary) note.summaryNative = summary;
  return note;
}

/** The share and the glossed words, once tokens and states are in. */
async function noteFor(
  deps: Required<PostCheckDeps>,
  plan: ImmersionPlan,
  tokens: Token[],
  hidden: readonly HiddenReading[],
) {
  const keys = [...new Set(tokens.filter(isContentToken).map(lookupKey))];
  const states = await statesOf(deps.learner, keys);
  const { content, aboveCount, above } = classifyTokens(tokens, states, plan.level);
  const words = await Promise.all(
    above.slice(0, MAX_GLOSSED).map((token) => glossed(deps, token, hidden)),
  );
  const unknownShare = content > 0 ? aboveCount / content : 0;
  return { words, unknownShare, fellBack: shouldFallBack(aboveCount, content) };
}

/**
 * Checks the Japanese of a reply against the learner (see the module comment). The summary is
 * redacted like the rest when targets are hidden. Never throws: a failure leaves it unchecked.
 */
export async function checkImmersion(
  texts: readonly string[],
  plan: ImmersionPlan,
  deps: PostCheckDeps,
  extra: { hidden: readonly HiddenReading[]; summary?: string | undefined },
): Promise<ImmersionNote> {
  const summary =
    extra.summary && extra.hidden.length > 0
      ? redactReadings(extra.summary, extra.hidden).text
      : extra.summary;
  const { learner, lang } = deps;
  if (!learner || !lang.tokenize) return unchecked(plan, summary);
  try {
    const { japanese, perText } = await tokensOf(lang, texts);
    const found = await noteFor({ learner, lang }, plan, perText.flat(), extra.hidden);
    const places = glossPlaces(japanese, perText, found.words);
    const note: ImmersionNote = {
      mode: plan.mode,
      ...found,
      texts: japanese,
      places,
      checked: true,
    };
    if (summary) note.summaryNative = summary;
    return note;
  } catch {
    return unchecked(plan, summary);
  }
}
