/**
 * The guides' tables: example verbs and adjectives, the て-form's sound changes, and the keigo
 * verbs. Japanese only; the forms shown are worked out by the conjugation engine. Pure.
 */
import {
  type AdjectiveForm,
  type Conjugation,
  classOf,
  conjugateAdjective,
  conjugateVerb,
  type VerbForm,
} from '../conjugation/index.ts';

/** A verb or adjective as written, and read. */
export interface Example {
  written: string;
  reading: string;
  /** Its class, where the spelling cannot tell (帰る looks like 食べる; いい becomes よく). */
  cls?: Conjugation;
}

const ex = (written: string, reading: string, cls?: Conjugation): Example =>
  cls ? { written, reading, cls } : { written, reading };

/** The three verb groups, with examples (the guide shows each in a few forms). */
export const VERB_GROUPS = {
  /** 五段: the last kana moves through its row (書か・書き・書く・書け・書こ). */
  godan: [
    ex('書く', 'かく'),
    ex('話す', 'はなす'),
    ex('待つ', 'まつ'),
    ex('読む', 'よむ'),
    ex('買う', 'かう'),
    ex('帰る', 'かえる', 'v5'),
  ],
  /** 一段: る drops (食べる → 食べます). */
  ichidan: [ex('食べる', 'たべる'), ex('見る', 'みる'), ex('起きる', 'おきる'), ex('寝る', 'ねる')],
  /** する and 来る, and every noun + する. */
  irregular: [ex('する', 'する'), ex('来る', 'くる'), ex('勉強する', 'べんきょうする')],
} as const;

/** Verbs that end in -iru or -eru, like group 2, but are group 1. */
export const LOOKALIKE_GODAN: readonly Example[] = [
  ex('帰る', 'かえる', 'v5'),
  ex('入る', 'はいる', 'v5'),
  ex('走る', 'はしる', 'v5'),
  ex('知る', 'しる', 'v5'),
  ex('切る', 'きる', 'v5'),
  ex('要る', 'いる', 'v5'),
];

/** A row of the て-form's sound changes: the endings, what they become, and examples. */
export interface TeRule {
  endings: readonly string[];
  te: string;
  ta: string;
  examples: readonly Example[];
}

/** Group 1, by the dictionary form's last kana. */
export const TE_RULES: readonly TeRule[] = [
  {
    endings: ['う', 'つ', 'る'],
    te: 'って',
    ta: 'った',
    examples: [ex('買う', 'かう'), ex('待つ', 'まつ'), ex('帰る', 'かえる', 'v5')],
  },
  {
    endings: ['む', 'ぶ', 'ぬ'],
    te: 'んで',
    ta: 'んだ',
    examples: [ex('読む', 'よむ'), ex('遊ぶ', 'あそぶ'), ex('死ぬ', 'しぬ')],
  },
  { endings: ['く'], te: 'いて', ta: 'いた', examples: [ex('書く', 'かく'), ex('聞く', 'きく')] },
  {
    endings: ['ぐ'],
    te: 'いで',
    ta: 'いだ',
    examples: [ex('泳ぐ', 'およぐ'), ex('急ぐ', 'いそぐ')],
  },
  { endings: ['す'], te: 'して', ta: 'した', examples: [ex('話す', 'はなす'), ex('貸す', 'かす')] },
];

/** The verbs outside the rows: group 2, the irregulars, and 行く. */
export const TE_OTHERS: readonly Example[] = [
  ex('食べる', 'たべる'),
  ex('見る', 'みる'),
  ex('する', 'する'),
  ex('来る', 'くる'),
  ex('行く', 'いく'),
];

/** Verbs to pick in the conjugation table, one or two of each kind. */
export const TABLE_VERBS: readonly Example[] = [
  ex('書く', 'かく'),
  ex('読む', 'よむ'),
  ex('話す', 'はなす'),
  ex('待つ', 'まつ'),
  ex('買う', 'かう'),
  ex('行く', 'いく'),
  ex('食べる', 'たべる'),
  ex('見る', 'みる'),
  ex('する', 'する'),
  ex('来る', 'くる'),
];

/** The forms the conjugation table lists, in teaching order. */
export const TABLE_FORMS: readonly VerbForm[] = [
  'dict',
  'masu',
  'nai',
  'ta',
  'nakatta',
  'te',
  'tai',
  'volitional',
  'potential',
  'passive',
  'causative',
  'imperative',
  'ba',
  'tara',
];

/** The plain and polite pairs of the plain-and-polite guide. */
export const PLAIN_POLITE: readonly (readonly [VerbForm, VerbForm])[] = [
  ['dict', 'masu'],
  ['nai', 'masen'],
  ['ta', 'mashita'],
  ['nakatta', 'masenDeshita'],
];

/** The example's class: as given, else from its spelling. */
export function classOfExample(example: Example): Conjugation | undefined {
  return example.cls ?? classOf(example.written, undefined, example.reading);
}

/** `example` (a verb) in `form`, written and read, as the engine makes it; undefined when it has none. */
export function verbIn(example: Example, form: VerbForm, cls = classOfExample(example)) {
  if (!cls) return undefined;
  const written = conjugateVerb(example.written, cls, form)[0];
  const reading = conjugateVerb(example.reading, cls, form)[0];
  return written && reading ? { written, reading } : undefined;
}

/** The い-adjectives of the adjectives guide; いい is the one that changes. */
export const I_ADJECTIVES: readonly Example[] = [
  ex('高い', 'たかい'),
  ex('いい', 'いい', 'adj-ix'),
];

/** The な-adjective of the adjectives guide. */
export const NA_ADJECTIVE: Example = ex('静か', 'しずか');

/** The adjectives guide's rows: plain, then polite. */
export const ADJECTIVE_ROWS = ['present', 'negative', 'past', 'negativePast', 'te'] as const;
export type AdjectiveRow = (typeof ADJECTIVE_ROWS)[number];

const I_FORMS: Record<AdjectiveRow, readonly [AdjectiveForm | 'dict', AdjectiveForm]> = {
  present: ['dict', 'desu'],
  negative: ['kunai', 'kunaiDesu'],
  past: ['katta', 'kattaDesu'],
  negativePast: ['kunakatta', 'kunakatta'],
  te: ['kute', 'kute'],
};

/** An い-adjective's plain and polite forms in a row (the polite past negative adds です). */
export function iAdjectiveIn(example: Example, row: AdjectiveRow): readonly [string, string] {
  const cls = example.cls ?? 'adj-i';
  const [plainForm, politeForm] = I_FORMS[row];
  const plain =
    plainForm === 'dict'
      ? example.written
      : (conjugateAdjective(example.written, cls, plainForm)[0] ?? '');
  const polite = conjugateAdjective(example.written, cls, politeForm)[0] ?? '';
  if (row === 'negativePast') return [plain, `${polite}です`];
  if (row === 'te') return [plain, ''];
  return [plain, polite];
}

const NA_ENDS: Record<AdjectiveRow, readonly [string, string]> = {
  present: ['だ', 'です'],
  negative: ['じゃない', 'じゃありません'],
  past: ['だった', 'でした'],
  negativePast: ['じゃなかった', 'じゃありませんでした'],
  te: ['で', ''],
};

/** A な-adjective's plain and polite forms in a row. */
export function naAdjectiveIn(example: Example, row: AdjectiveRow): readonly [string, string] {
  const [plain, polite] = NA_ENDS[row];
  return [example.written + plain, polite ? example.written + polite : ''];
}

/** A keigo verb: the plain verb, its respectful (尊敬語) and humble (謙譲語) forms. */
export interface KeigoVerb {
  plain: string;
  sonkei?: Example;
  kenjou?: Example;
}

export const KEIGO_VERBS: readonly KeigoVerb[] = [
  { plain: 'いる', sonkei: ex('いらっしゃる', 'いらっしゃる'), kenjou: ex('おる', 'おる') },
  { plain: '行く・来る', sonkei: ex('いらっしゃる', 'いらっしゃる'), kenjou: ex('参る', 'まいる') },
  { plain: '言う', sonkei: ex('おっしゃる', 'おっしゃる'), kenjou: ex('申す', 'もうす') },
  {
    plain: '食べる・飲む',
    sonkei: ex('召し上がる', 'めしあがる'),
    kenjou: ex('いただく', 'いただく'),
  },
  {
    plain: '見る',
    sonkei: ex('ご覧になる', 'ごらんになる'),
    kenjou: ex('拝見する', 'はいけんする'),
  },
  { plain: 'する', sonkei: ex('なさる', 'なさる'), kenjou: ex('いたす', 'いたす') },
  {
    plain: '知っている',
    sonkei: ex('ご存じだ', 'ごぞんじだ'),
    kenjou: ex('存じている', 'ぞんじている'),
  },
  { plain: '会う', kenjou: ex('お目にかかる', 'おめにかかる') },
  { plain: '聞く・訪ねる', kenjou: ex('伺う', 'うかがう') },
  { plain: 'あげる', kenjou: ex('差し上げる', 'さしあげる') },
  { plain: 'もらう', kenjou: ex('いただく', 'いただく') },
  { plain: 'くれる', sonkei: ex('くださる', 'くださる') },
  { plain: '寝る', sonkei: ex('お休みになる', 'おやすみになる') },
];

/** The patterns that make most verbs respectful or humble, each with an example. */
export const KEIGO_PATTERNS = [
  { id: 'oNiNaru', shape: 'お＋ます形＋になる', example: '待つ → お待ちになる' },
  { id: 'reru', shape: '〜（ら）れる', example: '書く → 書かれる' },
  { id: 'oSuru', shape: 'お＋ます形＋する', example: '持つ → お持ちする' },
  { id: 'goSuru', shape: 'ご＋名詞＋する', example: '説明 → ご説明する' },
] as const;

/** The guide's example sentences, translated in the messages under the same id. */
export const KEIGO_SENTENCES = [
  { id: 'irassharu', ja: '先生は何時にいらっしゃいますか。' },
  { id: 'oKaeri', ja: '部長はもうお帰りになりました。' },
  { id: 'okuri', ja: '駅までお送りします。' },
  { id: 'moushimasu', ja: '田中と申します。' },
] as const;
