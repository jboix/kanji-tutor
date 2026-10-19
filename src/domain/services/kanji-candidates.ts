/**
 * Kanji spellings for kana being typed (C6), like an IME's candidate row: the kana just before
 * the caret, or the selected kana (hiragana only), looked up by reading in the local dictionary only. No
 * network, no AI. Tapping a candidate replaces that kana.
 */
import { hasKanji, toKanaFold } from '../kana.ts';
import type { Repos } from '../repos.ts';
import type { Word } from '../types.ts';

/**
 * Hiragana: the characters a kana run is made of. Katakana stays katakana (D109): it is how a
 * loanword or a name is written, not a reading waiting for its kanji.
 */
const KANA = /^[ぁ-ゖ]$/u;
/** The longest kana run looked up: longer runs are rarely one word. */
const MAX_RUN = 8;
/** Candidates shown at most. */
export const CANDIDATE_LIMIT = 8;

/** One spelling to offer: `form` replaces `text.slice(start, end)`, which reads `kana`. */
export interface KanjiCandidate {
  form: string;
  kana: string;
  start: number;
  end: number;
  wordId: string;
  /** The learner tracks the word (level 1 or more). */
  known: boolean;
}

/** A span of the text to look up. */
interface Run {
  kana: string;
  start: number;
  end: number;
}

const isKana = (text: string) => text !== '' && [...text].every((char) => KANA.test(char));

/** Where the kana run that ends at `end` starts (at most {@link MAX_RUN} characters back). */
function runStart(text: string, end: number): number {
  let start = end;
  while (start > 0 && end - start < MAX_RUN && KANA.test(text[start - 1] ?? '')) start--;
  return start;
}

/**
 * The spans to look up, longest first: a kana selection as it is, else every ending of the
 * kana run just before the caret (がくせい, くせい, せい, い), so the last word typed is found.
 */
export function kanaRuns(text: string, start: number, end = start): Run[] {
  if (end > start) {
    const kana = text.slice(start, end);
    return isKana(kana) ? [{ kana, start, end }] : [];
  }
  const runs: Run[] = [];
  for (let from = runStart(text, start); from < start; from++) {
    runs.push({ kana: text.slice(from, start), start: from, end: start });
  }
  return runs;
}

const JLPT_RANK = (word: Word) => word.jlpt ?? 0;

/** Known words first (most known first), then common ones, then the easier JLPT level. */
function rank(words: readonly Word[], levels: ReadonlyMap<string, number>): Word[] {
  const level = (word: Word) => levels.get(word.id) ?? 0;
  return [...words].sort(
    (a, b) =>
      level(b) - level(a) ||
      Number(b.common) - Number(a.common) ||
      JLPT_RANK(b) - JLPT_RANK(a) ||
      (a.forms[0]?.length ?? 0) - (b.forms[0]?.length ?? 0),
  );
}

/** Words read exactly as `kana`, with a kanji form. */
async function wordsReading(repos: Repos, kana: string): Promise<Word[]> {
  const words = await repos.dictionary.wordsByText(kana);
  const folded = toKanaFold(kana);
  const reads = (w: Word) => w.readings.some((r) => toKanaFold(r) === folded);
  return words.filter((w) => reads(w) && w.forms.some(hasKanji));
}

async function trackedLevels(repos: Repos, words: readonly Word[]) {
  const items = await repos.items.getMany(words.map((w) => `word:${w.id}` as const));
  return new Map(items.flatMap((item) => (item ? [[item.ref, item.level] as const] : [])));
}

/**
 * Kanji spellings for the kana at the caret or in the selection (C6): longer runs first, and
 * within a run the learner's own words first, then common words and easier levels. One entry
 * per spelling, at most `limit`.
 */
export async function kanjiCandidates(
  repos: Repos,
  text: string,
  selection: { start: number; end: number },
  limit = CANDIDATE_LIMIT,
): Promise<KanjiCandidate[]> {
  const runs = kanaRuns(text, selection.start, selection.end);
  const found = await Promise.all(runs.map((run) => wordsReading(repos, run.kana)));
  const levels = await trackedLevels(repos, found.flat());
  const seen = new Set<string>();
  const out: KanjiCandidate[] = [];
  runs.forEach((run, i) => {
    for (const word of rank(found[i] ?? [], levels)) {
      const form = word.forms.find(hasKanji) ?? '';
      if (seen.has(form)) continue;
      seen.add(form);
      out.push({ form, ...run, wordId: word.id, known: (levels.get(word.id) ?? 0) > 0 });
    }
  });
  return out.slice(0, limit);
}

/** The text with the candidate's kana replaced by its spelling, and the caret just after it. */
export function applyCandidate(text: string, candidate: KanjiCandidate) {
  const { start, end, form } = candidate;
  return { text: text.slice(0, start) + form + text.slice(end), caret: start + form.length };
}
