/**
 * Questions fit the learner's level (J6): before a 文脈規定 (J3) or 文法形式の判断 (J4) question is
 * shown, its sentence, answer and options must be at or below the learner's level, by word,
 * kanji and grammar level. The pack's sentence level already counts its kanji words and grammar
 * (D40, D56); this also catches pronouns written in kanji (お前), untagged kanji words, kana
 * words that are clearly harder (むしろ, もたれる), and option kanji (瓦 for グラム).
 */
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { hasKanji } from '../kana.ts';
import type { Repos } from '../repos.ts';
import type { WordLevels } from '../session-types.ts';
import type { Kanji, LearnerLevel, Sentence, Token, Word } from '../types.ts';

/** Bound pieces and grammar, levelled with the grammar or not at all. */
const FREE_POS: ReadonlySet<string> = new Set([
  'particle',
  'auxiliary',
  'symbol',
  'suffix',
  'prefix',
]);
/**
 * Kana words are judged by the easiest list word written or read that way, and only when that
 * is two levels or more harder: the token itself is often resolved to a rare kanji entry
 * (いま as 居間, ひく as 轢く), and the lists tag some kana words oddly. Pronouns and
 * adnominals (これ as N1, あの) are not judged at all.
 */
const KANA_CHECKED: ReadonlySet<string> = new Set(['verb', 'adjective', 'adverb', 'noun']);
const KANA_MARGIN = 2;
/** Grammatical nouns and set phrases the lists level as their rare kanji entries (事 N3). */
const KANA_FREE: ReadonlySet<string> = new Set([
  'こと',
  'もの',
  'ところ',
  'とこ',
  'よう',
  'ため',
  'はず',
  'わけ',
  'つもり',
  'ほう',
  'まま',
  'うち',
  'とき',
  'ころ',
  'ごめん',
  'よろしく',
  'ごらん',
  'ちょうだい',
]);
const HIRAGANA = /^[\p{Script=Hiragana}ー]+$/u;
const KANJI = /\p{Script=Han}/gu;

const grammarLevel = new Map(GRAMMAR_CATALOGUE.map((e) => [e.id, e.level]));

export interface LevelFitContext {
  repos: Repos;
  levels: WordLevels;
  learnerLevel: LearnerLevel;
}

function kanjiFit(text: string, kanji: ReadonlyMap<string, Kanji | undefined>, level: number) {
  const chars = (text.match(KANJI) ?? []).filter((c) => c !== '々');
  return chars.every((c) => (kanji.get(c)?.jlpt ?? 1) >= level);
}

interface Lookups {
  words: ReadonlyMap<string, Word | undefined>;
  kanji: ReadonlyMap<string, Kanji | undefined>;
  /** The easiest list level of any word written or read like a kana base form. */
  kana: ReadonlyMap<string, number | undefined>;
}

/** A word written with kanji: its list level, else the level of its kanji. */
function kanjiWordFits(token: Token, jlpt: number | undefined, level: number, found: Lookups) {
  return jlpt === undefined ? kanjiFit(token.surface, found.kanji, level) : jlpt >= level;
}

/** A kana word whose base form is judged (see `KANA_CHECKED`). */
const judgedKana = (token: Token) =>
  HIRAGANA.test(token.surface) && KANA_CHECKED.has(token.pos) && !KANA_FREE.has(token.base);

/** A kana word: out only when every word read so is two levels or more harder. */
function kanaWordFits(token: Token, jlpt: number | undefined, level: number, found: Lookups) {
  if (!judgedKana(token) || (jlpt !== undefined && jlpt >= level)) return true;
  const easiest = found.kana.get(token.base);
  return easiest === undefined || easiest > level - KANA_MARGIN;
}

/** Whether a token of the sentence is within the level, or a word the learner already has. */
function tokenFits(token: Token, ctx: LevelFitContext, found: Lookups): boolean {
  const id = token.wordId;
  if (!id || FREE_POS.has(token.pos) || (ctx.levels.get(id) ?? 0) >= 1) return true;
  const jlpt = found.words.get(id)?.jlpt;
  return hasKanji(token.surface)
    ? kanjiWordFits(token, jlpt, ctx.learnerLevel, found)
    : kanaWordFits(token, jlpt, ctx.learnerLevel, found);
}

/** The easiest list level among the words written or read like `text`. */
async function easiestLevel(repos: Repos, text: string): Promise<number | undefined> {
  const levels = (await repos.dictionary.wordsByText(text)).flatMap((w) => w.jlpt ?? []);
  return levels.length > 0 ? Math.max(...levels) : undefined;
}

async function lookups(repos: Repos, sentence: Sentence, texts: readonly string[]) {
  const ids = [...new Set(sentence.tokens.flatMap((t) => t.wordId ?? []))];
  const chars = [...new Set([sentence.text, ...texts].join('').match(KANJI) ?? [])];
  const bases = [...new Set(sentence.tokens.filter(judgedKana).map((t) => t.base))];
  const [words, kanji, kana] = await Promise.all([
    repos.dictionary.words(ids),
    repos.dictionary.kanjiMany(chars),
    Promise.all(bases.map((base) => easiestLevel(repos, base))),
  ]);
  return {
    words: new Map(ids.map((id, i) => [id, words[i]])),
    kanji: new Map(chars.map((c, i) => [c, kanji[i]])),
    kana: new Map(bases.map((base, i) => [base, kana[i]])),
  };
}

/**
 * True when the sentence's words and grammar and the options' kanji are all at or below the
 * learner's level (J6). `options` are the texts shown, the answer among them.
 */
export async function fitsLevel(
  ctx: LevelFitContext,
  sentence: Sentence,
  options: readonly string[],
): Promise<boolean> {
  const level = ctx.learnerLevel;
  const grammar = sentence.grammarIds ?? [];
  if (grammar.some((id) => (grammarLevel.get(id) ?? 5) < level)) return false;
  const found = await lookups(ctx.repos, sentence, options);
  if (!options.every((text) => kanjiFit(text, found.kanji, level))) return false;
  return sentence.tokens.every((token) => tokenFits(token, ctx, found));
}
