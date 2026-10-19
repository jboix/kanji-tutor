/**
 * What each question generator is built from, loaded over the `Repos` port: dictionary
 * entries, homographs and homophones, lookalike kanji, same-level words and the grammar
 * catalogue. Each maker tries one sentence and returns a question or undefined.
 */
import { seededOrder } from '../drills/seed.ts';
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { hasKanji } from '../kana.ts';
import type { Repos } from '../repos.ts';
import { unknownTokens } from '../selector.ts';
import { isLoneKanji, preferredReading } from '../services/reading-check.ts';
import type { WordLevels } from '../session-types.ts';
import type { Kanji, LearnerLevel, Sentence, Token, Word } from '../types.ts';
import { blankable, contextWordQuestion, display, sameKind } from './context-word.ts';
import { grammarFormQuestion } from './grammar-form.ts';
import { kanjiReadingQuestion } from './kanji-reading.ts';
import { fitsLevel } from './level-fit.ts';
import { baseForm, orthographyQuestion } from './orthography.ts';
import { particleFormQuestion } from './particle-form.ts';
import { sentenceOrderQuestion } from './sentence-order.ts';
import type { Question } from './types.ts';

/** Everything the makers share for one session. */
export interface QuestionContext {
  repos: Repos;
  levels: WordLevels;
  /** Sentences that passed the session's reading checks and are free to use. */
  sentences: readonly Sentence[];
  /** Words the session asks to read: never shown in a question first. */
  avoid: ReadonlySet<string>;
  /** Grammar up to this level is asked (N5 = 5 asks N5 points only). */
  learnerLevel: LearnerLevel;
  /** Grammar points to blank first (the learner's own, then the session's new ones). */
  grammar: readonly string[];
  /** Grammar points not to blank: not introduced yet (G4). */
  skipGrammar?: ReadonlySet<string>;
  /** Whether a sentence exists in the packs; the session's sentences when not given. */
  known?: (text: string) => boolean;
  seed: string;
}

const TEXTS = new WeakMap<readonly Sentence[], ReadonlySet<string>>();

/** The context's sentence check: `known`, else whether one of its sentences reads so. */
export function knownText(ctx: QuestionContext): (text: string) => boolean {
  if (ctx.known) return ctx.known;
  const texts = TEXTS.get(ctx.sentences) ?? new Set(ctx.sentences.map((s) => s.text));
  TEXTS.set(ctx.sentences, texts);
  return (text) => texts.has(text);
}

export type Maker = (ctx: QuestionContext, sentence: Sentence) => Promise<Question | undefined>;

/** Lookalikes kept per kanji, and same-level words tried as 文脈規定 distractors. */
const LOOKALIKES = 6;
const CANDIDATES = 10;
const CORPUS_PER_WORD = 30;

async function kanjiMap(repos: Repos, surface: string): Promise<Map<string, Kanji>> {
  const chars = [...new Set([...surface].filter(hasKanji))];
  const entries = (await repos.dictionary.kanjiMany(chars)).filter((k) => k !== undefined);
  return new Map(entries.map((k) => [k.char, k]));
}

/**
 * Surfaces two common words share, whose reading the tokenizer may get wrong: 行った is いった
 * or おこなった, 方 is ほう or かた, 開いて is あいて or ひらいて.
 */
const TWO_READINGS = new Set([
  '行っ',
  '方',
  '開い',
  '開け',
  '止め',
  '辛い',
  '空い',
  '怒っ',
  '上手',
  '下手',
]);

/** A number written in kanji (二千, 百): its reading is arithmetic, not a word. */
const NUMERAL = /^[〇一二三四五六七八九十百千万億]+$/u;

/** A surface whose reading a question could get wrong or that asks nothing (行った, 二千). */
export const misleading = (surface: string) => TWO_READINGS.has(surface) || NUMERAL.test(surface);

/** Kanji tokens the learner tracks, in a sentence whose other content words are all known. */
function askable(ctx: QuestionContext, sentence: Sentence): number[] {
  const unknown = unknownTokens(sentence, ctx.levels);
  const tracked = (t: Token) =>
    t.wordId !== undefined &&
    hasKanji(t.surface) &&
    !ctx.avoid.has(t.wordId) &&
    !misleading(t.surface) &&
    (ctx.levels.get(t.wordId) ?? 0) >= 1;
  return sentence.tokens.flatMap((t, i) =>
    tracked(t) && unknown.every((u) => u === i) ? [i] : [],
  );
}

/** Entries written like the token, without the word itself. */
async function homographsOf(repos: Repos, token: Token, word: Word) {
  const found = [
    ...(await repos.dictionary.wordsByText(token.base)),
    ...(await repos.dictionary.wordsByText(token.surface)),
  ];
  return [...new Map(found.filter((w) => w.id !== word.id).map((w) => [w.id, w])).values()];
}

/** The token's word and homographs, unless it is a lone kanji read other than most likely. */
async function wordOf(ctx: QuestionContext, token: Token) {
  const word =
    token.wordId === undefined ? undefined : await ctx.repos.dictionary.word(token.wordId);
  if (!word) return undefined;
  const homographs = await homographsOf(ctx.repos, token, word);
  const likely = preferredReading(token.surface, [word, ...homographs]);
  if (isLoneKanji(token) && likely !== token.reading) return undefined;
  return { word, homographs };
}

/** For each askable token in turn, the first question `make` builds. */
async function firstToken(
  ctx: QuestionContext,
  sentence: Sentence,
  make: (
    token: Token,
    index: number,
    word: Word,
    homographs: Word[],
  ) => Promise<Question | undefined>,
) {
  for (const index of askable(ctx, sentence)) {
    const token = sentence.tokens[index];
    const found = token && (await wordOf(ctx, token));
    const question = found && token && (await make(token, index, found.word, found.homographs));
    if (question) return question;
  }
  return undefined;
}

export const kanjiReadingMaker: Maker = (ctx, sentence) =>
  firstToken(ctx, sentence, async (token, tokenIndex, word, homographs) => {
    const kanji = await kanjiMap(ctx.repos, token.surface);
    const input = { sentence, tokenIndex, word, homographs, kanji, seed: ctx.seed };
    return fitting(ctx, sentence, kanjiReadingQuestion(input), false);
  });

/** A kanji a learner meets: on a JLPT list or taught in school. 燵 or 檎 would give the answer away. */
export const everydayKanji = (k: Kanji) =>
  k.jlpt !== undefined || (k.grade !== undefined && k.grade <= 8);

/** Kanji sharing the most parts with `entry`, common ones first. */
async function lookalikesOf(repos: Repos, entry: Kanji): Promise<Kanji[]> {
  const lists = await Promise.all(
    entry.components.map((c) => repos.dictionary.kanjiByComponent(c)),
  );
  const shared = new Map<string, { kanji: Kanji; count: number }>();
  for (const kanji of lists.flat().filter((k) => k.char !== entry.char && everydayKanji(k))) {
    shared.set(kanji.char, { kanji, count: (shared.get(kanji.char)?.count ?? 0) + 1 });
  }
  const freq = (k: Kanji) => k.freq ?? Number.MAX_SAFE_INTEGER;
  return [...shared.values()]
    .sort((a, b) => b.count - a.count || freq(a.kanji) - freq(b.kanji))
    .slice(0, LOOKALIKES)
    .map((s) => s.kanji);
}

async function byForms(repos: Repos, forms: readonly string[]) {
  const found = await Promise.all(
    forms.map(async (f) => [f, await repos.dictionary.wordsByText(f)] as const),
  );
  return new Map(found);
}

async function orthographyFor(
  ctx: QuestionContext,
  sentence: Sentence,
  tokenIndex: number,
  token: Token,
  word: Word,
) {
  const kanji = await kanjiMap(ctx.repos, token.surface);
  const lookalikes = new Map(
    await Promise.all(
      [...kanji.values()].map(async (k) => [k.char, await lookalikesOf(ctx.repos, k)] as const),
    ),
  );
  const base = baseForm(word, token.surface) ?? '';
  const swapped = [...lookalikes].flatMap(([char, list]) =>
    list.map((k) => base.replace(char, k.char)),
  );
  const homophones = await everyday(
    ctx.repos,
    await ctx.repos.dictionary.wordsByText(word.readings[0] ?? ''),
  );
  const byForm = await byForms(ctx.repos, swapped);
  const input = {
    sentence,
    tokenIndex,
    word,
    kanji,
    lookalikes,
    homophones,
    byForm,
    seed: ctx.seed,
  };
  return orthographyQuestion(input);
}

export const orthographyMaker: Maker = (ctx, sentence) =>
  firstToken(ctx, sentence, async (token, index, word) =>
    fitting(ctx, sentence, await orthographyFor(ctx, sentence, index, token, word), false),
  );

/** Same-level words of the same part of speech, cached per level for the session. */
function levelWords(ctx: QuestionContext) {
  const cache = new Map<number, Promise<Word[]>>();
  return (level: Word['jlpt']) => {
    if (level === undefined || !ctx.repos.dictionary.wordsByJlpt) return Promise.resolve([]);
    const list = cache.get(level) ?? ctx.repos.dictionary.wordsByJlpt(level);
    cache.set(level, list);
    return list;
  };
}

/**
 * Words written only with kanji on a JLPT list: an archaic or rare spelling (粁 for キロ, 此方
 * for こちら) would give the answer away.
 */
async function everyday(repos: Repos, list: readonly Word[]): Promise<Word[]> {
  const chars = [...new Set(list.flatMap((w) => [...display(w)].filter(hasKanji)))];
  const entries = await repos.dictionary.kanjiMany(chars);
  const listed = new Set(entries.flatMap((k) => (k?.jlpt === undefined ? [] : [k.char])));
  return list.filter((w) => [...display(w)].filter(hasKanji).every((c) => listed.has(c)));
}

/** A 文脈規定 answer of the learner's level or easier (J6): its distractors share its level. */
const atLevel = (word: Word, level: LearnerLevel) => word.jlpt !== undefined && word.jlpt >= level;

/**
 * The question when its sentence fits the learner's level (J6), and its options too when
 * `options` is set (J3, J4). A 表記 question's lookalike kanji are the exercise, so a reading or
 * spelling question checks the sentence only.
 */
async function fitting(
  ctx: QuestionContext,
  sentence: Sentence,
  question: Question | undefined,
  options = true,
) {
  if (!question) return undefined;
  const texts = options ? question.options.map((o) => o.text) : [];
  return (await fitsLevel(ctx, sentence, texts)) ? question : undefined;
}

/** Same-level distractor candidates for a 文脈規定 answer, with sentences that use them. */
async function contextCandidates(
  ctx: QuestionContext,
  load: ReturnType<typeof levelWords>,
  sentence: Sentence,
  word: Word,
) {
  const all = (await load(word.jlpt)).filter((w) => sameKind(word, w));
  const order = seededOrder(all, (w) => w.id, `${ctx.seed}|${sentence.id}`);
  const candidates = (await everyday(ctx.repos, order)).slice(0, CANDIDATES);
  const lists = await Promise.all(
    candidates.map(async (c) =>
      (await ctx.repos.sentences.containingWord(c.id)).slice(0, CORPUS_PER_WORD),
    ),
  );
  return { candidates, corpus: [...lists.flat(), ...ctx.sentences] };
}

/** Builds a 文脈規定 maker with its own same-level word cache. */
export function contextWordMaker(): Maker {
  let byLevel: ReturnType<typeof levelWords> | undefined;
  return (ctx, sentence) => {
    byLevel ??= levelWords(ctx);
    const load = byLevel;
    if (!sentence.translation) return Promise.resolve(undefined);
    return firstToken(ctx, sentence, async (_token, tokenIndex, word) => {
      if (!blankable(word.pos?.[0]) || !atLevel(word, ctx.learnerLevel)) return undefined;
      const { candidates, corpus } = await contextCandidates(ctx, load, sentence, word);
      const known = knownText(ctx);
      const input = { sentence, tokenIndex, word, candidates, corpus, known, seed: ctx.seed };
      return fitting(ctx, sentence, contextWordQuestion(input));
    });
  };
}

/**
 * Grammar points of the learner's level and the one below (an N4 learner gets N5 and N4
 * points, an N3 learner N4 and N3): たい is no N3 question.
 */
export const catalogueFor = (level: LearnerLevel) =>
  GRAMMAR_CATALOGUE.filter((e) => e.level >= level && e.level <= level + 1);

/** Distractor points: at or below the learner's level (J6); たがる is no option for N5. */
const poolFor = (level: LearnerLevel) => GRAMMAR_CATALOGUE.filter((e) => e.level >= level);

/** Every content word known: a grammar or order question has nothing else to read. */
const allKnown = (ctx: QuestionContext, sentence: Sentence) =>
  unknownTokens(sentence, ctx.levels).length === 0;

export const grammarFormMaker: Maker = async (ctx, sentence) => {
  if (!allKnown(ctx, sentence)) return undefined;
  const catalogue = catalogueFor(ctx.learnerLevel);
  const skip = ctx.skipGrammar ? { skip: ctx.skipGrammar } : {};
  const question = grammarFormQuestion({
    sentence,
    catalogue,
    pool: poolFor(ctx.learnerLevel),
    prefer: ctx.grammar,
    known: knownText(ctx),
    seed: ctx.seed,
    ...skip,
  });
  // N5 has too few forms of one shape for a form question; it is asked a particle (D95).
  const particle = (q: typeof question) =>
    q ?? (ctx.learnerLevel === 5 ? particleN5(ctx, sentence) : undefined);
  return fitting(ctx, sentence, particle(question));
};

function particleN5(ctx: QuestionContext, sentence: Sentence) {
  const question = particleFormQuestion({ sentence, seed: ctx.seed });
  const skipped = question?.itemId && ctx.skipGrammar?.has(question.itemId.replace('grammar:', ''));
  return skipped ? undefined : question;
}

export const sentenceOrderMaker: Maker = async (ctx, sentence) => {
  if (!allKnown(ctx, sentence)) return undefined;
  const catalogue = catalogueFor(ctx.learnerLevel);
  const question = sentenceOrderQuestion({ sentence, catalogue, seed: ctx.seed });
  return fitting(ctx, sentence, question, false);
};
