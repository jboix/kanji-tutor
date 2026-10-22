/**
 * The conjugation engine for typed drills (S4): a verb or an い-adjective in a named form, as
 * written and as read. It builds on the question conjugator (`questions/conjugate.ts`) for the
 * forms that one has, and adds the potential, passive, causative and imperative. Each form has a
 * JLPT level, so a drill only asks for forms at or below the learner's. Pure.
 */
import {
  type Conjugation,
  classOfForm,
  classOfPos,
  type Inflection,
  inflect,
} from '../questions/conjugate.ts';
import type { LearnerLevel } from '../types.ts';

/** The forms a drill can ask for. */
export type VerbForm =
  | 'dict'
  | 'masu'
  | 'masen'
  | 'mashita'
  | 'masenDeshita'
  | 'stem'
  | 'te'
  | 'ta'
  | 'nai'
  | 'nakatta'
  | 'tai'
  | 'mashou'
  | 'volitional'
  | 'potential'
  | 'passive'
  | 'causative'
  | 'imperative'
  | 'ba'
  | 'tara';

/** The JLPT level each form is taught at, by common consensus (Genki I–II, Minna 1–2). */
export const FORM_LEVEL: Readonly<Record<VerbForm, LearnerLevel>> = {
  dict: 5,
  masu: 5,
  masen: 5,
  mashita: 5,
  masenDeshita: 5,
  stem: 5,
  te: 5,
  ta: 5,
  nai: 5,
  nakatta: 5,
  tai: 5,
  mashou: 5,
  volitional: 4,
  potential: 4,
  passive: 4,
  causative: 4,
  imperative: 4,
  ba: 4,
  tara: 4,
};

/** The forms the question conjugator already has, by its names. */
const BASIC: Partial<Record<VerbForm, Inflection>> = {
  dict: 'dict',
  masu: 'polite',
  masen: 'politeNeg',
  mashita: 'politePast',
  masenDeshita: 'politeNegPast',
  te: 'te',
  ta: 'past',
  nai: 'neg',
  nakatta: 'negPast',
  tai: 'tai',
  mashou: 'mashou',
  volitional: 'volitional',
  ba: 'ba',
  tara: 'tara',
};

/** Forms at or below `level` (5 is N5, the easiest), in teaching order. */
export function formsAt(level: LearnerLevel): VerbForm[] {
  return (Object.keys(FORM_LEVEL) as VerbForm[]).filter((form) => FORM_LEVEL[form] >= level);
}

const first = (dict: string, cls: Conjugation, form: Inflection) => inflect(dict, cls, form)[0];

/** The ない stem (書か, 食べ, 来): the ない form without ない. */
function aStem(dict: string, cls: Conjugation): string | undefined {
  return first(dict, cls, 'neg')?.replace(/ない$/u, '');
}

/** The ば stem (書け, 食べれ): the ば form without ば. */
function eStem(dict: string, cls: Conjugation): string | undefined {
  return first(dict, cls, 'ba')?.replace(/ば$/u, '');
}

type Derived = 'potential' | 'passive' | 'causative' | 'imperative';

/** する and くる, whose derived forms do not follow from their stems. */
function irregular(dict: string, cls: Conjugation, form: Derived): string | undefined {
  if (cls === 'vs') {
    const head = dict.slice(0, -2);
    const ends = {
      potential: 'できる',
      passive: 'される',
      causative: 'させる',
      imperative: 'しろ',
    };
    return dict.endsWith('する') ? head + ends[form] : undefined;
  }
  const kanji = dict.endsWith('来る');
  if (!kanji && !dict.endsWith('くる')) return undefined;
  const k = `${dict.slice(0, -2)}${kanji ? '来' : 'こ'}`;
  const ends = { potential: 'られる', passive: 'られる', causative: 'させる', imperative: 'い' };
  return k + ends[form];
}

/** Ichidan and godan verbs: from the ない stem, or the ば stem for the potential and imperative. */
function regular(dict: string, cls: Conjugation, form: Derived): string | undefined {
  const a = aStem(dict, cls);
  const e = eStem(dict, cls);
  if (a === undefined || e === undefined) return undefined;
  if (cls === 'v1') {
    const ends = { potential: 'られる', passive: 'られる', causative: 'させる', imperative: 'ろ' };
    return a + ends[form];
  }
  const table = { potential: `${e}る`, passive: `${a}れる`, causative: `${a}せる`, imperative: e };
  return table[form];
}

/** ある has no potential, passive, causative or imperative; くださる and the like keep to polite. */
const NO_DERIVED: ReadonlySet<Conjugation> = new Set(['v5r-i', 'v5aru']);

function derived(dict: string, cls: Conjugation, form: Derived): string | undefined {
  if (NO_DERIVED.has(cls)) return undefined;
  if (cls === 'vs' || cls === 'vk') return irregular(dict, cls, form);
  return regular(dict, cls, form);
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

/** Whether a class is a verb's (not an adjective, ない or the copula). */
export const isVerbClass = (cls: Conjugation): boolean => VERBS.has(cls);

/**
 * `dict` (a verb in its dictionary form, written or read) in `form`: every usual surface, the
 * most usual first. Empty when the form does not exist for the verb (ある has no potential).
 */
export function conjugateVerb(dict: string, cls: Conjugation, form: VerbForm): string[] {
  if (!VERBS.has(cls)) return [];
  if (form === 'stem') {
    const masu = first(dict, cls, 'polite');
    return masu ? [masu.replace(/ます$/u, '')] : [];
  }
  const basic = BASIC[form];
  if (basic) return inflect(dict, cls, basic);
  const found = derived(dict, cls, form as Derived);
  return found ? [found] : [];
}

/** The forms an い-adjective has in drills. */
export type AdjectiveForm =
  | 'desu'
  | 'katta'
  | 'kattaDesu'
  | 'kunai'
  | 'kunaiDesu'
  | 'kunakatta'
  | 'kute';

const ADJECTIVE: Readonly<Record<AdjectiveForm, Inflection>> = {
  desu: 'polite',
  katta: 'past',
  kattaDesu: 'politePast',
  kunai: 'neg',
  kunaiDesu: 'politeNeg',
  kunakatta: 'negPast',
  kute: 'te',
};

/** An い-adjective (高い, いい) in `form`, every usual surface first to last. */
export function conjugateAdjective(dict: string, cls: Conjugation, form: AdjectiveForm): string[] {
  if (cls !== 'adj-i' && cls !== 'adj-ix') return [];
  return inflect(dict, cls, ADJECTIVE[form]);
}

/**
 * How a word conjugates: from its JMdict part-of-speech tags when they say, else from its
 * ending (る after an i or e kana is ichidan, but 帰る, 入る and a few others are godan). A
 * kanji right before る (寝る, 見る) says nothing, so the reading's ending decides then.
 */
export function classOf(
  dict: string,
  pos?: readonly string[],
  reading?: string,
): Conjugation | undefined {
  const tagged = classOfPos(pos);
  if (tagged) return tagged;
  const kanjiRu = /\p{Script=Han}る$/u.test(dict);
  return (kanjiRu && reading ? classOfForm(reading) : undefined) ?? classOfForm(dict);
}

export type { Conjugation } from '../questions/conjugate.ts';
