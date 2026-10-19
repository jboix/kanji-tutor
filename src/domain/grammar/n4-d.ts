/** N4 grammar, part D: time, amounts, manner, senses, wishes, commands and requests. */
import {
  afterDict,
  afterNoun,
  afterPast,
  afterPlain,
  afterPred,
  afterVerb,
  suru,
  te,
} from './common.ts';
import { alt, b, behind, end, not, notPrev, opt, prev, s, seq, stop, tok } from './dsl.ts';
import type { GrammarEntry } from './types.ts';

const に = s('に');
/** Verbs whose な at the end is an exclamation (度胸があるな), not a prohibition. */
const STATIVE_VERBS = ['ある', 'できる', '分かる', 'わかる', '見える', '聞こえる', '違う', '要る'];
/** Nouns of a stretch of time; other N の間 are mostly "between" or "among". */
const PERIOD_NOUNS = [
  '休み',
  '夏休み',
  '冬休み',
  '春休み',
  '留守',
  '授業',
  '会議',
  '旅行',
  '食事',
  '当分',
  '試験',
  '滞在',
  '仕事',
  '週末',
  '入院',
  '練習',
  '長い',
  '少し',
  'しばらく',
];
const afterPeriod = alt(behind(seq(s(...PERIOD_NOUNS), s('の')), 2), prev({ base: 'いる' }));

export const N4_D: readonly GrammarEntry[] = [
  {
    id: 'aida',
    pattern: '〜間',
    level: 4,
    family: 'time',
    meaning: 'during, while (the whole time)',
    formation: 'V-ている / N + の + 間',
    explanation:
      '間 covers a whole stretch of time, and the main action goes on all through it. With に it becomes a point inside that stretch.',
    cloze: ['間', 'あいだ'],
    rule: seq(afterPeriod, s('間', 'あいだ'), not(に)),
  },
  {
    id: 'aida-ni',
    pattern: '〜間に',
    level: 4,
    family: 'time',
    meaning: 'while, during (at some point)',
    formation: 'V-ている / N + の + 間に',
    explanation:
      '間に places a single event inside a period: 留守の間に, "while I was out". Compare 間, which lasts the whole period.',
    cloze: ['間に', 'あいだに'],
    rule: seq(afterPeriod, s('間', 'あいだ'), に),
  },
  {
    id: 'made-ni',
    pattern: '〜までに',
    level: 4,
    family: 'time',
    meaning: 'by (a deadline)',
    formation: 'time / V-dictionary + までに',
    explanation:
      'までに sets a deadline: the action happens at some point before it. まで alone means the action lasts until then.',
    cloze: ['までに'],
    rule: seq(s('まで'), に),
  },
  {
    id: 'zutsu',
    pattern: '〜ずつ',
    level: 4,
    family: 'quantity',
    meaning: 'each, at a time',
    formation: 'amount + ずつ',
    explanation:
      'ずつ shares out an amount equally, or repeats it step by step: 少しずつ, "little by little".',
    cloze: ['ずつ'],
    rule: s('ずつ'),
  },
  {
    id: 'bakari',
    pattern: '〜ばかり',
    level: 4,
    family: 'quantity',
    meaning: 'nothing but, only',
    formation: 'N + ばかり',
    explanation:
      'ばかり after a noun says that there is only that, and usually complains about it. ゲームばかりしている means "does nothing but play games".',
    cloze: ['ばかり'],
    rule: seq(afterNoun, s('ばかり')),
  },
  {
    id: 'naide',
    pattern: '〜ないで',
    level: 4,
    family: 'manner',
    meaning: 'without doing',
    formation: 'V-ない + で',
    explanation:
      'ないで says that an action happens without another one that would be normal: 朝ご飯を食べないで, "without eating breakfast".',
    cloze: ['ないで'],
    rule: seq(afterVerb, s('ない'), s('で'), not(s('ください', '下さい', 'ほしい', '欲しい'))),
  },
  {
    id: 'ta-mama',
    pattern: '〜たまま',
    level: 4,
    family: 'manner',
    meaning: 'with … still (unchanged)',
    formation: 'V-た / N + の + まま',
    explanation:
      'まま says that a state stays as it was while something else happens, often when it should not: 電気をつけたまま寝た.',
    cloze: ['まま'],
    rule: seq(alt(afterPast, prev({ surface: 'の' })), s('まま')),
  },
  {
    id: 'ga-suru',
    pattern: '〜がする',
    level: 4,
    family: 'sense',
    meaning: 'there is a (sound, smell, taste)',
    formation: '音 / におい / 味 / 声 + がする',
    explanation:
      'する with a sense word says that the sense is perceived: 変な音がする, "I hear a strange noise". The speaker is not the doer.',
    cloze: ['がす', 'がし'],
    rule: seq(s('音', '匂い', 'におい', '臭い', '声', '味', '香り'), s('が'), suru),
  },
  {
    id: 'tagaru',
    pattern: '〜たがる',
    level: 4,
    family: 'desire',
    meaning: '(someone else) wants to',
    formation: 'V-stem + たがる / い-adj (drop い) + がる',
    explanation:
      "がる describes another person's wishes or feelings from the outside. It is often used as がっている.",
    cloze: ['たが', 'が'],
    rule: seq(alt(prev({ pos: 'auxiliary', base: 'たい' }), prev({ pos: 'adjective' })), b('がる')),
  },
  {
    id: 'te-hoshii',
    pattern: '〜てほしい',
    level: 4,
    family: 'desire',
    meaning: 'want someone to do',
    formation: 'person + に + V-て + ほしい',
    explanation:
      "てほしい wishes for someone else's action. To a superior it sounds too direct, so a request is better.",
    cloze: ['てほし', 'でほし', 'て欲し', 'で欲し'],
    rule: seq(te, b('ほしい', '欲しい')),
  },
  {
    id: 'imperative',
    pattern: '〜ろ／〜え (命令形)',
    level: 4,
    family: 'command',
    meaning: 'do it! (command)',
    formation: 'godan V (〜え) / ichidan V (〜ろ)',
    explanation:
      'The imperative is a blunt order. It appears in sports, signs, emergencies and rough speech, and rarely in polite talk.',
    cloze: ['ろ', 'え', 'け', 'せ', 'て', 'ね', 'べ', 'め', 'れ', 'げ', 'よ'],
    rule: seq(
      tok({
        pos: 'verb',
        plain: false,
        ends: ['ろ', 'え', 'け', 'せ', 'て', 'ね', 'べ', 'め', 'れ', 'げ', 'よ'],
      }),
      opt(s('よ')),
      stop,
    ),
  },
  {
    id: 'na-prohibition',
    pattern: '〜な (禁止)',
    level: 4,
    family: 'command',
    meaning: 'do not! (prohibition)',
    formation: 'V-dictionary + な',
    explanation:
      'な after the dictionary form is a blunt "don\'t". It is the negative of the imperative and just as strong.',
    cloze: ['な'],
    rule: seq(
      afterDict,
      notPrev({ base: STATIVE_VERBS }),
      tok({ surface: 'な', pos: 'particle' }),
      end,
    ),
  },
  {
    id: 'nasai',
    pattern: '〜なさい',
    level: 4,
    family: 'command',
    meaning: 'do it (instruction)',
    formation: 'V-stem + なさい',
    explanation:
      'なさい is an order from someone in charge, such as a parent or a test paper. It is firm but not rude.',
    cloze: ['なさい'],
    rule: seq(afterVerb, s('なさい')),
  },
  {
    id: 'te-kuremasen-ka',
    pattern: '〜てくれませんか',
    level: 4,
    family: 'request',
    meaning: 'would you do … for me?',
    formation: 'V-て + くれませんか',
    explanation:
      'Asking whether someone will do a favour is softer than a direct request. ませんか leaves them room to refuse.',
    cloze: ['てくれませんか', 'でくれませんか'],
    rule: seq(te, b('くれる'), s('ませ'), s('ん'), s('か')),
  },
  {
    id: 'te-moraemasen-ka',
    pattern: '〜てもらえませんか',
    level: 4,
    family: 'request',
    meaning: 'could I have you do …?',
    formation: 'V-て + もらえませんか',
    explanation:
      'This asks whether you could receive the favour, which is more modest than くれませんか. The receiver, not the doer, is the hidden subject.',
    cloze: ['てもらえ', 'でもらえ'],
    rule: seq(te, b('もらえる'), s('ませ'), s('ん'), s('か')),
  },
  {
    id: 'kana',
    pattern: '〜かな',
    level: 4,
    family: 'sentence-ending',
    meaning: 'I wonder',
    formation: 'plain form + かな',
    explanation:
      'かな is a question to oneself, said aloud. It is casual; かしら is a softer variant.',
    cloze: ['かな'],
    rule: seq(afterPred, s('か'), s('な'), end),
  },
  {
    id: 'sa-noun',
    pattern: '〜さ',
    level: 4,
    family: 'nominalizer',
    meaning: '-ness (degree as a noun)',
    formation: 'い-adj (drop い) / な-adj + さ',
    explanation:
      'さ turns an adjective into a noun of degree: 高さ is "height". It measures, while 〜み names a feeling.',
    cloze: ['さ'],
    rule: seq(prev({ pos: 'adjective' }), tok({ surface: 'さ', pos: 'suffix' })),
  },
  {
    id: 'no-nominal',
    pattern: '〜のは／〜のが／〜のを',
    level: 4,
    family: 'nominalizer',
    meaning: 'doing (verb as a noun)',
    formation: 'V-plain + の + は / が / を',
    explanation:
      'の turns a clause into a noun so it can be a subject or an object. It suits things perceived directly; こと suits abstract facts.',
    cloze: ['のは', 'のが', 'のを'],
    rule: seq(afterPlain, tok({ surface: 'の', pos: 'noun' }), s('は', 'が', 'を')),
  },
];
