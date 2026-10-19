/**
 * 文の組み立て (J5): four adjacent chunks of a sentence (a content word with the particles and
 * endings after it), shuffled; the question asks which goes in the ★ slot of `_ _ ★ _`.
 */
import { hashText, seededOrder } from '../drills/seed.ts';
import { detectEntries } from '../grammar/detect.ts';
import type { GrammarEntry } from '../grammar/types.ts';
import { itemId } from '../ids.ts';
import { hasKanji } from '../kana.ts';
import type { ItemId, Sentence, Token } from '../types.ts';
import { OPTION_COUNT, optionKey } from './options.ts';
import { questionId, tokenRange } from './stem.ts';
import { note, type OrderQuestion, type QuestionOption, SECTION } from './types.ts';

/** A bunsetsu-like piece: tokens [first, last] of the sentence, and their text. */
export interface Chunk {
  text: string;
  first: number;
  last: number;
  /** Punctuation only: never a piece to order. */
  symbol: boolean;
}

/** Tokens that lean on the token before them. */
const ATTACHING = new Set(['particle', 'auxiliary', 'suffix']);
/** A chunk this long is a phrase, not a piece. */
const MAX_CHUNK = 10;

/** A particle, auxiliary or suffix, or the する of a noun verb (紹介し in 紹介したい). */
const leansBack = (token: Token, prev: Token | undefined) =>
  ATTACHING.has(token.pos) || (token.base === 'する' && prev?.pos === 'noun');

/**
 * Cuts tokens into chunks: each content token starts one, and particles, auxiliaries and
 * suffixes join the chunk before them (本を, 読みました), as does the する of a noun verb. A
 * prefix joins the next token (お茶).
 */
export function chunks(tokens: readonly Token[]): Chunk[] {
  const out: Chunk[] = [];
  tokens.forEach((token, i) => {
    const last = out.at(-1);
    const symbol = token.pos === 'symbol';
    const leans = !symbol && last && !last.symbol && leansBack(token, tokens[i - 1]);
    const prefixed = last && tokens[i - 1]?.pos === 'prefix' && !symbol;
    if (last && (leans || prefixed)) {
      last.text += token.surface;
      last.last = i;
    } else out.push({ text: token.surface, first: i, last: i, symbol });
  });
  return out;
}

/** Particles after which a phrase can move around the sentence (村が川と… or 川と…村が). */
const FREE_PARTICLES = new Set([
  'は',
  'が',
  'を',
  'に',
  'で',
  'へ',
  'と',
  'も',
  'から',
  'まで',
  'より',
  'だけ',
  'しか',
  'ばかり',
  'など',
  'ぐらい',
  'くらい',
  'でも',
  'なら',
  'ほど',
]);

/** Nouns that only follow what they nominalize (読むのが, 行くことは): never moved. */
const BOUND = new Set(['の', 'こと', 'もの', 'ん', 'ところ']);

const QUANTITY = /^([0-9０-９〇一二三四五六七八九十百千万]|何|誰|だれ|どこ)/u;

/**
 * 何か, 誰も, いくつか, 一つ, 百ドル, 何本: an indefinite or an amount that floats like an
 * adverb (一ついいことが / いいことが一つ).
 */
function indefinite(chunk: Chunk, tokens: readonly Token[]): boolean {
  const first = tokens[chunk.first];
  const last = tokens[chunk.last];
  if (first?.pos === 'verb' || !last) return false;
  const counted = QUANTITY.test(first?.surface ?? '');
  const pair = chunk.last === chunk.first + 1;
  const some =
    pair && (last.surface === 'か' || (counted && ['も', 'でも'].includes(last.surface)));
  return some || (counted && last.pos !== 'particle');
}

/**
 * の, こと, もの after a verb or adjective (読むのが): bound to the clause before it. After
 * どんな or たいした it is an ordinary noun phrase that can move (どんなものにも).
 */
const nominalizer = (chunk: Chunk, tokens: readonly Token[]) =>
  BOUND.has(tokens[chunk.first]?.surface ?? '') &&
  ['verb', 'adjective', 'auxiliary'].includes(tokens[chunk.first - 1]?.pos ?? '');

/** A chunk that could sit elsewhere in the sentence: a case-marked phrase, an adverb, a bare noun. */
function movable(chunk: Chunk, tokens: readonly Token[]): boolean {
  if (nominalizer(chunk, tokens)) return false;
  if (indefinite(chunk, tokens)) return true;
  const last = tokens[chunk.last];
  // で after a noun is a particle or the copula's te-form (マジで): it marks a phrase either way.
  if (last && (last.pos === 'particle' || last.surface === 'で'))
    return FREE_PARTICLES.has(last.surface);
  return chunk.first === chunk.last && ['adverb', 'noun', 'pronoun'].includes(last?.pos ?? '');
}

const isTopic = (chunk: Chunk, tokens: readonly Token[]) => tokens[chunk.last]?.surface === 'は';

const CONTENT = new Set(['noun', 'verb', 'adjective', 'adverb']);
/** What a piece can start with: a word, never a particle, an ending or a stray kana (ま of たまえ). */
const HEADS = new Set([
  'noun',
  'pronoun',
  'verb',
  'adjective',
  'adverb',
  'adnominal',
  'prefix',
  'conjunction',
  'interjection',
]);
/** Verbs that only follow another word (たがる, 食べすぎる, 読まれる): never a piece's head. */
const LEANING_VERBS = new Set([
  'がる',
  'すぎる',
  'れる',
  'られる',
  'せる',
  'させる',
  'てる',
  'ちゃう',
]);
const HIRAGANA = /^[ぁ-ゖ]$/u;

/** A token the tokenizer cut out of a longer word (こ of こぶ, せ of 瀬戸際). */
const fragment = (t: Token) =>
  t.pos === 'noun' && HIRAGANA.test(t.surface) && !BOUND.has(t.surface);

/** A stem with its ending cut off (新し of 新しいんだ, はね of はねられる). */
const cutStem = (t: Token | undefined) =>
  t !== undefined &&
  (t.pos === 'verb' || t.pos === 'adjective') &&
  t.surface !== t.base &&
  !/[てで]$/u.test(t.surface);

/**
 * A chunk that can be a piece: its content words resolved and whole, not a stem without its
 * ending, and a nominalizer (の, こと, ん) only with the particle after it (のを, ことが).
 */
function piece(chunk: Chunk, tokens: readonly Token[]): boolean {
  const own = tokens.slice(chunk.first, chunk.last + 1);
  const first = own[0];
  if (!first || chunk.symbol || cutStem(own.at(-1)) || compoundTail(chunk, tokens)) return false;
  // A piece starts with a word, not with the rest of the one before (られて of かけられて).
  const prev = tokens[chunk.first - 1];
  // After a misparse (この|つ|ぼの for このつぼの) the piece is part of a broken word.
  const broken = prev?.pos === 'auxiliary' && prev.wordId === undefined;
  if (!HEADS.has(first.pos) || LEANING_VERBS.has(first.base) || cutStem(prev) || broken)
    return false;
  if (BOUND.has(first.surface)) return own.length > 1;
  // Endings resolve too: an auxiliary without an entry is a misparse (い|つ for いつ).
  const words = own.filter((t) => CONTENT.has(t.pos) || t.pos === 'auxiliary');
  return words.every((t) => t.wordId !== undefined && !fragment(t));
}

/** A noun right after a noun: the rest of a compound (半 of 一時間半, ブレーキ of ハンドブレーキ). */
const compoundTail = (chunk: Chunk, tokens: readonly Token[]) =>
  tokens[chunk.first]?.pos === 'noun' && tokens[chunk.first - 1]?.pos === 'noun';

/** 山ほど, 三人だけ, たくさん: amounts float like adverbs. */
const AMOUNT_PARTICLES = new Set(['ほど', 'ぐらい', 'くらい', 'だけ', 'ばかり']);
const AMOUNT_WORDS = new Set(['たくさん', '少し', '全部', 'みんな', '皆', '大勢', 'いっぱい']);

const QUESTION_WORDS = new Set([
  'どこ',
  '何',
  'なに',
  'なん',
  'いつ',
  '誰',
  'だれ',
  'どれ',
  'どう',
]);

/** A piece that floats across phrases: an adverb, an indefinite (何か) or a question word (どこ). */
const isAdverb = (chunk: Chunk, tokens: readonly Token[]) => {
  const one = chunk.first === chunk.last ? tokens[chunk.first] : undefined;
  const last = tokens[chunk.last]?.surface ?? '';
  const amount = chunk.last > chunk.first && AMOUNT_PARTICLES.has(last);
  const word = one?.surface ?? '';
  return (
    one?.pos === 'adverb' ||
    one?.pos === 'conjunction' ||
    QUESTION_WORDS.has(word) ||
    AMOUNT_WORDS.has(word) ||
    amount ||
    indefinite(chunk, tokens)
  );
};

/** A te-form clause piece (おめかしして): an adverb or question word can cross it too. */
const teForm = (chunk: Chunk, tokens: readonly Token[]) =>
  /[てで]$/u.test(tokens[chunk.last]?.surface ?? '') && tokens[chunk.last]?.pos === 'particle';

/** A noun with の (家の, 私の): two of them could each modify either noun after them. */
const nounNo = (chunk: Chunk, tokens: readonly Token[]) =>
  chunk.last > chunk.first &&
  tokens[chunk.last]?.surface === 'の' &&
  tokens[chunk.last - 1]?.pos !== 'verb';

const ADNOMINAL = /^(大きな|小さな|おかしな|いろいろな|色々な|いろんな|たくさんの|多くの)$/u;

/** Whether a noun comes next, past other adjectives (大きな新しい建物). */
function nounFollows(tokens: readonly Token[], from: number): boolean {
  let i = from;
  while (tokens[i]?.pos === 'adjective' || tokens[i]?.pos === 'adnominal') i++;
  return tokens[i]?.pos === 'noun';
}

/** An adjective before a noun (新しい, 大きな, きれいな): two of them can swap. */
const modifier = (chunk: Chunk, tokens: readonly Token[]) => {
  const t = tokens[chunk.last];
  const plainAdjective = t?.pos === 'adjective' && t.surface === t.base;
  const naAdjective = chunk.last > chunk.first && t?.surface === 'な';
  const text = tokens
    .slice(chunk.first, chunk.last + 1)
    .map((x) => x.surface)
    .join('');
  if (ADNOMINAL.test(text)) return true;
  return chunk.first === chunk.last ? plainAdjective : naAdjective;
};

/**
 * A phrase that ends in a case particle (彼女は, ことが, のを), or a noun phrase whose particle
 * was dropped (あの人たち): an adverb can cross it.
 */
const caseMarked = (chunk: Chunk, tokens: readonly Token[]) => {
  const last = tokens[chunk.last];
  const bare = last?.pos === 'suffix' || (last?.pos === 'noun' && !BOUND.has(last.surface));
  return chunk.last > chunk.first && (FREE_PARTICLES.has(last?.surface ?? '') || bare);
};

/**
 * How many pieces of the window could sit elsewhere. A topic opening the sentence (漢字は…)
 * stays first unless another piece could move too; an adverb counts double when a
 * case-marked phrase is there to cross (もっと聞きたいことが / 聞きたいことがもっと).
 */
/**
 * Two or more modifiers (その, 古い, 町の) and two nouns they could go with, inside the window
 * or right after it: 古い教会はその町の北 / その町の古い教会は北.
 */
const PREDICATE = new Set(['verb', 'adjective', 'auxiliary']);

function modifiersReorder(window: readonly Chunk[], tokens: readonly Token[]): boolean {
  const adnominal = (c: Chunk) => c.first === c.last && tokens[c.first]?.pos === 'adnominal';
  const mods = window.filter((c) => nounNo(c, tokens) || modifier(c, tokens) || adnominal(c));
  const heads = window.filter((c) => caseMarked(c, tokens) && !nounNo(c, tokens)).length;
  const end = window.at(-1)?.last ?? 0;
  const after = tokens[end + 1]?.pos === 'noun' ? 1 : 0;
  // 池でたくさんの生きている魚 / 池で生きているたくさんの魚: a clause and a modifier swap.
  const clause = after === 1 && PREDICATE.has(tokens[end]?.pos ?? '');
  return (mods.length > 1 && heads + after > 1) || (clause && mods.length > 0);
}

function freePieces(window: readonly Chunk[], tokens: readonly Token[], start: number): number {
  const moving = window.filter((c) => movable(c, tokens));
  const topic = start === 0 && window[0] !== undefined && isTopic(window[0], tokens);
  const others = moving.length - Number(topic && moving.includes(window[0] as Chunk));
  const floating = window.filter((c) => isAdverb(c, tokens));
  const crossable = (c: Chunk) =>
    caseMarked(c, tokens) ||
    teForm(c, tokens) ||
    (c.last > c.first && tokens[c.last]?.surface === 'か');
  const crossing = floating.length > 0 && window.some((c) => !floating.includes(c) && crossable(c));
  const mixed = modifiersReorder(window, tokens);
  const before = (c: Chunk) => nounFollows(tokens, c.last + 1);
  const stacked = window.filter((c) => modifier(c, tokens) && before(c)).length > 1;
  return (others === 0 ? 0 : moving.length) + Number(crossing) + Number(stacked || mixed) * 2;
}

/**
 * Windows of four neighbouring, distinct, short word chunks with at most one that can move:
 * Japanese word order is free for case-marked phrases, so two of them could swap and give a
 * second right order (and another piece in the ★ slot).
 */
function windows(list: readonly Chunk[], tokens: readonly Token[]): number[] {
  const starts: number[] = [];
  for (let i = 0; i + OPTION_COUNT <= list.length; i++) {
    const window = list.slice(i, i + OPTION_COUNT);
    const keys = new Set(window.map((c) => optionKey(c.text)));
    // The piece after the window must not finish its last word (一時間 | 半かかった).
    const next = list[i + OPTION_COUNT];
    const ok =
      window.every((c) => c.text.length <= MAX_CHUNK && piece(c, tokens)) &&
      !(next && compoundTail(next, tokens));
    if (ok && freePieces(window, tokens, i) <= 1 && keys.size === OPTION_COUNT) starts.push(i);
  }
  return starts;
}

export interface SentenceOrderInput {
  sentence: Sentence;
  catalogue: readonly GrammarEntry[];
  seed: string;
}

/** The item the order tests: a grammar point inside the window, else its first word. */
function testedItem(input: SentenceOrderInput, window: readonly Chunk[]): ItemId | undefined {
  const first = window[0]?.first ?? 0;
  const last = window.at(-1)?.last ?? 0;
  const inside = detectEntries(input.catalogue, input.sentence.tokens).find(
    (m) => m.start >= first && m.end - 1 <= last,
  );
  if (inside) return itemId('grammar', inside.id);
  const word = input.sentence.tokens
    .slice(first, last + 1)
    .find((t) => t.wordId !== undefined && hasKanji(t.surface));
  return word?.wordId === undefined ? undefined : itemId('word', word.wordId);
}

function optionsFor(window: readonly Chunk[], star: number): QuestionOption[] {
  const whole = window.map((c) => c.text).join(' ');
  return window.map((chunk, slot) => ({
    text: chunk.text,
    note:
      slot === star
        ? note('order-star', { text: chunk.text, whole })
        : note('order-slot', { text: chunk.text, slot: slot + 1 }),
  }));
}

/** A shuffle that never shows the pieces in their own order. */
function shuffled(options: QuestionOption[], seed: string): QuestionOption[] {
  const order = seededOrder(options, (o) => o.text, seed);
  const same = order.every((o, i) => o === options[i]);
  return same ? [...order.slice(1), ...order.slice(0, 1)] : order;
}

/**
 * A 文の組み立て question, or undefined when the sentence has no four neighbouring distinct
 * word chunks with at most one movable phrase, or nothing to review. The ★ slot is the
 * seed's pick among the four; the answer is unique because the four pieces all differ and only
 * one of them could move.
 */
export function sentenceOrderQuestion(input: SentenceOrderInput): OrderQuestion | undefined {
  const { sentence, seed } = input;
  const list = chunks(sentence.tokens);
  const start = seededOrder(windows(list, sentence.tokens), String, seed)[0];
  const window = start === undefined ? [] : list.slice(start, start + OPTION_COUNT);
  const first = window[0];
  const last = window.at(-1);
  const item = testedItem(input, window);
  const range = first && last && tokenRange(sentence.tokens, first.first, last.last);
  if (!(first && range && item)) return undefined;
  const star = hashText(`${seed}|${sentence.id}`) % OPTION_COUNT;
  const inOrder = optionsFor(window, star);
  const options = shuffled(inOrder, seed);
  const order = inOrder.map((o) => options.indexOf(o));
  return {
    id: questionId('sentence-order', sentence.id, first.first),
    kind: 'sentence-order',
    section: SECTION['sentence-order'],
    before: sentence.text.slice(0, range.from),
    after: sentence.text.slice(range.to),
    ...{ star, order, options, answer: order[star] ?? 0, itemId: item, sentenceId: sentence.id },
    ...(sentence.translation ? { translation: sentence.translation } : {}),
  };
}
