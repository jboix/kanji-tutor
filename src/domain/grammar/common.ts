/** Matchers shared by many catalogue rules: te-form, plain endings, copula, negation. */
import { alt, b, type Matcher, prev, s, seq, tok } from './dsl.ts';

const PRED = ['verb', 'auxiliary', 'adjective'];
const NOUNISH = ['noun', 'pronoun', 'suffix'];

/** The て/で of a te-form, right after a verb, auxiliary or adjective (not the particle で). */
export const te: Matcher = seq(
  prev({ pos: PRED }),
  tok({ surface: ['て', 'で'], pos: 'particle' }),
);

/** Zero-width: the token before is a verb, auxiliary or adjective. */
export const afterPred: Matcher = prev({ pos: PRED });

/** Zero-width: the token before is a noun, pronoun or noun suffix. */
export const afterNoun: Matcher = prev({ pos: NOUNISH });

/** Zero-width: the token before is a verb. */
export const afterVerb: Matcher = prev({ pos: 'verb' });

/** Zero-width: the clause before ends in a plain (dictionary, た or ない) form. */
export const afterPlain: Matcher = alt(
  prev({ pos: 'verb', plain: true }),
  prev({ pos: 'adjective', plain: true }),
  prev({ pos: 'auxiliary', surface: ['た', 'だ', 'ない', 'たい'] }),
);

/** Zero-width: the token before is a verb in its dictionary form. */
export const afterDict: Matcher = prev({ pos: 'verb', plain: true });

/** Zero-width: the token before is the past た/だ. */
export const afterPast: Matcher = prev({ pos: 'auxiliary', surface: ['た', 'だ'] });

/** だ or です in any form (でした, でしょう, …). */
export const copula: Matcher = tok({ pos: 'auxiliary', base: ['だ', 'です'] });

/** いい / よい / 良い in any form. */
export const ii: Matcher = b('いい', 'よい', '良い');

/** Negation: ない in any form, or ません. */
export const neg: Matcher = alt(b('ない'), seq(b('ます'), s('ん')));

/** なる in any form. */
export const naru: Matcher = b('なる', '成る');

/** する in any form. */
export const suru: Matcher = b('する');

/** ある in any form. */
export const aru: Matcher = b('ある', '有る');

/** いる in any form. */
export const iru: Matcher = b('いる', '居る');

/** こと, kana or kanji. */
export const koto: Matcher = s('こと', '事');

/** Common na-adjective stems; the tokens do not keep IPADIC's 形容動詞語幹 tag. */
export const NA_ADJECTIVES = [
  'きれい',
  '綺麗',
  '静か',
  '便利',
  '不便',
  '元気',
  '大切',
  '大事',
  '簡単',
  '上手',
  '下手',
  '有名',
  '親切',
  '丁寧',
  '楽',
  '暇',
  '自由',
  '安全',
  '危険',
  '大丈夫',
  '賑やか',
  'にぎやか',
  '必要',
  '大変',
  '特別',
  '複雑',
  '真面目',
  'まじめ',
  '幸せ',
  '健康',
  '確か',
  '明らか',
  '十分',
  '好き',
  '嫌い',
  '立派',
  '素敵',
  'すてき',
  '残念',
  '心配',
  '安心',
  '新鮮',
  '自然',
  '平和',
  '豊か',
];

/** One na-adjective stem from `NA_ADJECTIVES`. */
export const naAdjective: Matcher = tok({ surface: NA_ADJECTIVES, pos: 'noun' });

/** Question words, which make か a question marker rather than "or". */
export const QUESTION_WORDS = [
  '何',
  'なに',
  'なん',
  '誰',
  'だれ',
  'どこ',
  'いつ',
  'どれ',
  'どちら',
  'いくら',
  'なぜ',
];

/** Nouns whose らしい usually means "typical of" (春らしい, 男らしい) rather than "it seems". */
export const TYPICAL_NOUNS = [
  '春',
  '夏',
  '秋',
  '冬',
  '男',
  '女',
  '子供',
  '子ども',
  '学生',
  '大人',
  '人間',
  '自分',
  '日本',
  '彼',
  '彼女',
  '君',
  'あなた',
  '私',
];
