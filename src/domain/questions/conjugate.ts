/**
 * A small conjugator for question options (J3, J4): godan, ichidan, する, くる, ある, the
 * respectful くださる group, い-adjectives (with いい), forms ending in ない, and the copula. It
 * covers the common forms only; anything else gives no surface, and the caller drops the option.
 */

/** How a dictionary form conjugates. */
export type Conjugation =
  | 'v1'
  | 'v5'
  | 'v5k-s'
  | 'v5aru'
  | 'v5r-i'
  | 'vs'
  | 'vk'
  | 'adj-i'
  | 'adj-ix'
  | 'nai'
  | 'copula';

/** The forms a blank may hold. Polite forms of adjectives and the copula take です. */
export type Inflection =
  | 'dict'
  | 'polite'
  | 'politePast'
  | 'politeNeg'
  | 'politeNegPast'
  | 'past'
  | 'te'
  | 'neg'
  | 'negPast'
  | 'tai'
  | 'volitional'
  | 'mashou'
  | 'tara'
  | 'ba';

export const INFLECTIONS: readonly Inflection[] = [
  'dict',
  'polite',
  'politePast',
  'politeNeg',
  'politeNegPast',
  'past',
  'te',
  'neg',
  'negPast',
  'tai',
  'volitional',
  'mashou',
  'tara',
  'ba',
];

const ROW_U = 'うくぐすつぬぶむる';
const ROW_A = 'わかがさたなばまら';
const ROW_I = 'いきぎしちにびみり';
const ROW_E = 'えけげせてねべめれ';
const ROW_O = 'おこごそとのぼもろ';
const GODAN_TE = ['って', 'いて', 'いで', 'して', 'って', 'んで', 'んで', 'んで', 'って'];

/** The godan row index of a dictionary form's last kana, or -1. */
const rowOf = (dict: string) => ROW_U.indexOf(dict.slice(-1));

/** Verb stems: the ない form, i (ます), e (ば), o (volitional), and the て form. */
interface VerbStems {
  neg: string;
  i: string;
  e: string;
  o: string;
  te: string;
}

function godanStems(dict: string, cls: Conjugation): VerbStems | undefined {
  const row = rowOf(dict);
  if (row < 0) return undefined;
  const head = dict.slice(0, -1);
  const at = (rowKana: string) => head + rowKana.charAt(row);
  const te = cls === 'v5k-s' ? `${head}って` : head + (GODAN_TE[row] ?? '');
  const i = cls === 'v5aru' ? `${head}い` : at(ROW_I);
  const neg = cls === 'v5r-i' ? `${dict.slice(0, -2)}ない` : `${at(ROW_A)}ない`;
  return { neg, i, e: at(ROW_E), o: at(ROW_O), te };
}

function irregularStems(dict: string, cls: Conjugation): VerbStems | undefined {
  if (cls === 'vs' && dict.endsWith('する')) {
    const head = dict.slice(0, -2);
    return {
      neg: `${head}しない`,
      i: `${head}し`,
      e: `${head}すれ`,
      o: `${head}しよ`,
      te: `${head}して`,
    };
  }
  if (cls !== 'vk') return undefined;
  const head = dict.slice(0, -2);
  if (dict.endsWith('来る')) {
    const k = `${head}来`;
    return { neg: `${k}ない`, i: k, e: `${k}れ`, o: `${k}よ`, te: `${k}て` };
  }
  if (!dict.endsWith('くる')) return undefined;
  return {
    neg: `${head}こない`,
    i: `${head}き`,
    e: `${head}くれ`,
    o: `${head}こよ`,
    te: `${head}きて`,
  };
}

function verbStems(dict: string, cls: Conjugation): VerbStems | undefined {
  if (cls === 'v1') {
    if (!dict.endsWith('る') || dict.length < 2) return undefined;
    const s = dict.slice(0, -1);
    return { neg: `${s}ない`, i: s, e: `${s}れ`, o: `${s}よ`, te: `${s}て` };
  }
  if (cls === 'vs' || cls === 'vk') return irregularStems(dict, cls);
  return godanStems(dict, cls);
}

const past = (te: string) => te.replace(/て$/u, 'た').replace(/で$/u, 'だ');

function verbForm(dict: string, s: VerbStems, form: Inflection): string {
  const table: Record<Inflection, string> = {
    dict,
    polite: `${s.i}ます`,
    politePast: `${s.i}ました`,
    politeNeg: `${s.i}ません`,
    politeNegPast: `${s.i}ませんでした`,
    past: past(s.te),
    te: s.te,
    neg: s.neg,
    negPast: s.neg.replace(/ない$/u, 'なかった'),
    tai: `${s.i}たい`,
    volitional: `${s.o}う`,
    mashou: `${s.i}ましょう`,
    tara: `${past(s.te)}ら`,
    ba: `${s.e}ば`,
  };
  return table[form];
}

/** い-adjective forms from the stem without い (高 for 高い, よ for いい). */
function adjectiveForms(dict: string, stem: string): Partial<Record<Inflection, string[]>> {
  return {
    dict: [dict],
    polite: [`${dict}です`],
    past: [`${stem}かった`],
    politePast: [`${stem}かったです`],
    te: [`${stem}くて`],
    neg: [`${stem}くない`],
    negPast: [`${stem}くなかった`],
    politeNeg: [`${stem}くないです`, `${stem}くありません`],
    tara: [`${stem}かったら`],
    ba: [`${stem}ければ`],
  };
}

/** What comes before ない that makes it "there is not" (がない, ではない, 違いない), not a verb. */
const NOT_A_VERB = /(が|は|も|で|じゃ|違い|く)$/u;

/** The polite negative of what comes before ない: 行かない → 行きません, ではない → ではありません. */
export function politeNegative(head: string): string {
  if (NOT_A_VERB.test(head) || head === '') return `${head}ありません`;
  const last = head.slice(-1);
  const a = ROW_A.indexOf(last);
  if (a >= 0) return `${head.slice(0, -1)}${ROW_I.charAt(a)}ません`;
  if (last === 'こ') return `${head.slice(0, -1)}きません`;
  return `${head}ません`;
}

function naiForms(dict: string): Partial<Record<Inflection, string[]>> {
  const head = dict.slice(0, -2);
  const polite = politeNegative(head);
  return {
    dict: [dict],
    polite: [polite, `${dict}です`],
    past: [`${head}なかった`],
    politePast: [`${polite}でした`, `${head}なかったです`],
    te: [`${head}なくて`],
    tara: [`${head}なかったら`],
    ba: [`${head}なければ`],
  };
}

function copulaForms(dict: string): Partial<Record<Inflection, string[]>> {
  const head = dict.slice(0, -1);
  return {
    dict: [dict],
    polite: [`${head}です`],
    past: [`${head}だった`],
    politePast: [`${head}でした`],
    te: [`${head}で`],
    neg: [`${head}じゃない`, `${head}ではない`],
    politeNeg: [`${head}じゃありません`, `${head}ではありません`],
    tara: [`${head}だったら`],
  };
}

function iiForms(dict: string): Partial<Record<Inflection, string[]>> {
  const head = dict.replace(/(いい|良い|よい)$/u, '');
  const stem = `${head}${dict.endsWith('良い') ? '良' : 'よ'}`;
  return { ...adjectiveForms(dict, stem), polite: [`${dict}です`] };
}

const NON_VERB: Partial<
  Record<Conjugation, [string, (dict: string) => Partial<Record<Inflection, string[]>>]>
> = {
  'adj-ix': ['い', iiForms],
  'adj-i': ['い', (dict) => adjectiveForms(dict, dict.slice(0, -1))],
  nai: ['ない', naiForms],
  copula: ['だ', copulaForms],
};

function nonVerbForms(dict: string, cls: Conjugation): Partial<Record<Inflection, string[]>> {
  const found = NON_VERB[cls];
  return found && dict.endsWith(found[0]) ? found[1](dict) : {};
}

/** ある has no wish, volitional or ましょう form, and its ない stands alone only after a particle. */
function aruLacks(dict: string, form: Inflection): boolean {
  if (form === 'tai' || form === 'volitional' || form === 'mashou') return true;
  const negative = form === 'neg' || form === 'negPast';
  return negative && !/(^|が|は|も)ある$/u.test(dict);
}

const VERBS: ReadonlySet<Conjugation> = new Set([
  'v1',
  'v5',
  'v5k-s',
  'v5aru',
  'v5r-i',
  'vs',
  'vk',
]);

/**
 * The surfaces of `dict` in `form`, the usual one first (ない gives ません and ないです). Empty
 * when the form does not exist for the class or the dictionary form does not fit it.
 */
export function inflect(dict: string, cls: Conjugation, form: Inflection): string[] {
  if (!VERBS.has(cls)) return nonVerbForms(dict, cls)[form] ?? [];
  if ((cls === 'v5r-i' && aruLacks(dict, form)) || (cls === 'v5aru' && form === 'tai')) return [];
  const stems = verbStems(dict, cls);
  return stems ? [verbForm(dict, stems, form)] : [];
}

/** The class of a JMdict part of speech list (v1, v5k, vs-i, adj-i…), if it conjugates. */
export function classOfPos(pos: readonly string[] | undefined): Conjugation | undefined {
  for (const tag of pos ?? []) {
    const cls = POS_CLASS[tag] ?? (/^v5[ukgsmbnrt]$/u.test(tag) ? 'v5' : undefined);
    if (cls) return cls;
  }
  return undefined;
}

const POS_CLASS: Readonly<Record<string, Conjugation>> = {
  v1: 'v1',
  'v1-s': 'v1',
  'v5k-s': 'v5k-s',
  v5aru: 'v5aru',
  'v5r-i': 'v5r-i',
  vk: 'vk',
  'vs-i': 'vs',
  'vs-s': 'vs',
  'adj-i': 'adj-i',
  'adj-ix': 'adj-ix',
};

/** Godan verbs in る that look ichidan (帰る, 入る), and the 〜きる compound. */
const GODAN_RU = /(帰る|入る|走る|知る|切る|要る|限る|減る|参る|喋る|しゃべる|滑る|握る|^きる)$/u;
const RESPECT = /(くださる|下さる|いらっしゃる|おっしゃる|なさる|ござる)$/u;

/** Verb endings in the order they are tried: the irregular ones, then ichidan, then godan. */
const VERB_ENDINGS: readonly [RegExp, Conjugation][] = [
  [/する$/u, 'vs'],
  [/(くる|来る)$/u, 'vk'],
  [/(いく|行く)$/u, 'v5k-s'],
  [RESPECT, 'v5aru'],
  [/ある$/u, 'v5r-i'],
  [GODAN_RU, 'v5'],
  [/[いきぎしちにびみりえけげせてねべめれ]る$/u, 'v1'],
  [/[うくぐすつぬぶむる]$/u, 'v5'],
];

const verbClassOf = (text: string) => VERB_ENDINGS.find(([re]) => re.test(text))?.[1];

/**
 * The class of a grammar form's last word, by its ending: する, くる, いく, ある, いい, ない,
 * い-adjectives, verbs (る after an i or e kana is ichidan, but for a short list), and だ.
 * Undefined for forms that do not conjugate (ために, ながら, ください).
 */
export function classOfForm(text: string): Conjugation | undefined {
  if (/(ください|下さい|なさい|ょう|ぐらい|くらい|せい|ずつ|なく|ずに)$/u.test(text))
    return undefined;
  if (/(いい|良い|よい)$/u.test(text)) return 'adj-ix';
  if (text.endsWith('ない')) return 'nai';
  if (text.endsWith('い')) return 'adj-i';
  if (text.endsWith('だ')) return 'copula';
  return verbClassOf(text);
}
