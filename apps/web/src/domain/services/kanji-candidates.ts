/**
 * Kanji spellings for kana being typed (C6), like a small input method: the hiragana run just
 * before the caret, or the selected hiragana, is cut into words with the local dictionary only
 * (no network, no AI), particles and endings kept in kana. The options are whole phrases (私は,
 * わたしは, ワタシは, 渡しは…), led by the first word alone with what would follow it greyed:
 * taking it converts that word only, and the rest is looked up next.
 */
import { toKatakana } from 'wanakana';
import { hasKanji } from '../kana.ts';
import type { Repos } from '../repos.ts';
import type { Word } from '../types.ts';
import { bestPath, MAX_WORD, type Segment, type Spelling } from './kana-lattice.ts';
import { lookupKeys, readsAs, spellerOf } from './kana-spellings.ts';

/**
 * Hiragana: the characters a kana run is made of. Katakana stays katakana: it is how a
 * loanword or a name is written, not a reading waiting for its kanji.
 */
const KANA = /^[ぁ-ゖ]$/u;
/** The longest kana run looked up: a short phrase. */
const MAX_RUN = 12;
/** Candidates shown at most. */
export const CANDIDATE_LIMIT = 8;

/** One spelling to offer: `form` replaces `text.slice(start, end)`, which reads `kana`. */
export interface KanjiCandidate {
  form: string;
  kana: string;
  start: number;
  end: number;
  /** Where the looked-up kana ends: after a first-word pick, the caret stays there. */
  runEnd: number;
  /** The learner tracks the word (level 1 or more). */
  known: boolean;
  wordId?: string;
  /** The first word only: what the rest of the phrase would become next, shown greyed. */
  next?: string;
}

/** A span of the text to look up. */
interface Run {
  kana: string;
  start: number;
  end: number;
}

/** Where the caret or the selection is, and where settled text ends (nothing before it). */
export interface LookupAt {
  start: number;
  end: number;
  /** Kana before this was settled by a pick: the run never reaches back past it. */
  from?: number;
}

const isKana = (text: string) => text !== '' && [...text].every((char) => KANA.test(char));

/** Where the kana run that ends at `end` starts: at most {@link MAX_RUN} back, never before `from`. */
function runStart(text: string, end: number, from: number): number {
  let start = end;
  while (start > from && end - start < MAX_RUN && KANA.test(text[start - 1] ?? '')) start--;
  return start;
}

/** The span to look up: a kana selection as it is, else the kana run just before the caret. */
export function kanaRun(text: string, { start, end, from = 0 }: LookupAt): Run | undefined {
  const at = end > start ? start : runStart(text, start, from <= start ? from : 0);
  const to = end > start ? end : start;
  const kana = text.slice(at, to);
  return isKana(kana) ? { kana, start: at, end: to } : undefined;
}

/** `repos.dictionary.wordsByText`, kept per dictionary: typing repeats the same spans. */
const cache = new WeakMap<object, Map<string, Promise<Word[]>>>();
const CACHE_SIZE = 4000;

function cacheOf(repos: Repos): Map<string, Promise<Word[]>> {
  const kept = cache.get(repos.dictionary) ?? new Map<string, Promise<Word[]>>();
  cache.set(repos.dictionary, kept);
  return kept;
}

function cachedWords(kept: Map<string, Promise<Word[]>>, repos: Repos, kana: string) {
  const found = kept.get(kana);
  if (found) return found;
  if (kept.size >= CACHE_SIZE) kept.clear();
  const words = repos.dictionary.wordsByText(kana);
  kept.set(kana, words);
  return words;
}

/** Words for each key; nothing at all may mean the dictionary is still loading: ask again later. */
async function lookUp(repos: Repos, keys: readonly string[]): Promise<Word[][]> {
  const kept = cacheOf(repos);
  const found = await Promise.all(keys.map((key) => cachedWords(kept, repos, key)));
  if (found.every((words) => words.length === 0)) for (const key of keys) kept.delete(key);
  return found;
}

async function trackedLevels(repos: Repos, words: readonly Word[]) {
  const ids = [...new Set(words.map((w) => `word:${w.id}` as const))];
  const items = await repos.items.getMany(ids);
  return new Map(items.flatMap((item) => (item ? [[item.ref, item.level] as const] : [])));
}

/** The run cut into its likeliest words, each with its spellings. */
async function segmentRun(repos: Repos, kana: string): Promise<Segment[]> {
  const keys = lookupKeys(kana, MAX_WORD);
  const found = await lookUp(repos, keys);
  const words = new Map(
    keys.map((key, i) => [key, (found[i] ?? []).filter((w) => readsAs(w, key))]),
  );
  const levels = await trackedLevels(repos, [...words.values()].flat());
  return bestPath(kana, spellerOf({ words, levels }));
}

const formOf = (segment: Segment | undefined) => segment?.spellings[0]?.form ?? segment?.kana ?? '';

/** The options for a whole phrase: same span, different spellings. */
function phraseOptions(run: Run, segments: readonly Segment[]): KanjiCandidate[] {
  const [first, ...others] = segments;
  const rest = others.map(formOf).join('');
  const whole = (form: string, spelling?: Spelling): KanjiCandidate => ({
    form,
    ...run,
    runEnd: run.end,
    known: others.length === 0 && (spelling?.known ?? false),
    ...(spelling?.wordId && others.length === 0 ? { wordId: spelling.wordId } : {}),
  });
  const spellings = first?.spellings ?? [];
  return [
    whole(formOf(first) + rest, spellings[0]),
    whole(run.kana),
    whole(toKatakana(first?.kana ?? '') + rest),
    ...spellings.slice(1).map((s) => whole(s.form + rest, s)),
  ];
}

/** The first word alone, with the rest greyed: only when the phrase has more than one word. */
function firstWordOption(run: Run, segments: readonly Segment[]): KanjiCandidate[] {
  const [first, ...others] = segments;
  const spelling = first?.spellings[0];
  if (!first || others.length === 0) return [];
  return [
    {
      form: formOf(first),
      kana: first.kana,
      start: run.start,
      end: run.start + first.kana.length,
      runEnd: run.end,
      known: spelling?.known ?? false,
      ...(spelling?.wordId ? { wordId: spelling.wordId } : {}),
      next: others.map(formOf).join(''),
    },
  ];
}

/** One option per phrase spelling, the first word's option kept apart from its whole phrase. */
function distinct(options: readonly KanjiCandidate[]): KanjiCandidate[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = `${option.end}:${option.form}`;
    return !seen.has(key) && seen.add(key);
  });
}

/**
 * Kanji spellings for the kana at the caret or in the selection (C6): the first word alone (with
 * the rest greyed), then the whole phrase as cut, in kana as typed, in katakana, and with the
 * first word's other spellings. Nothing when no option has a kanji. At most `limit`.
 */
export async function kanjiCandidates(
  repos: Repos,
  text: string,
  at: LookupAt,
  limit = CANDIDATE_LIMIT,
): Promise<KanjiCandidate[]> {
  const run = kanaRun(text, at);
  if (!run) return [];
  const segments = await segmentRun(repos, run.kana);
  const options = distinct([...firstWordOption(run, segments), ...phraseOptions(run, segments)]);
  return options.some((option) => hasKanji(option.form)) ? options.slice(0, limit) : [];
}

/**
 * The text with the candidate's kana replaced by its spelling. The caret goes after the
 * spelling, or, for the first word only, stays at the end of the phrase; `settled` is where the
 * converted part ends, so the next lookup starts there.
 */
export function applyCandidate(text: string, candidate: KanjiCandidate) {
  const { start, end, form, runEnd } = candidate;
  const settled = start + form.length;
  const caret = Math.max(runEnd, end) + form.length - (end - start);
  return { text: text.slice(0, start) + form + text.slice(end), caret, settled };
}
