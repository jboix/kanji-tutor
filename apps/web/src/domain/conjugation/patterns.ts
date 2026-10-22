/**
 * Pattern drills, as in a textbook's 練習 A/B (S4): a cue word and a grammar point, and the
 * learner types the cue transformed with it (食べる → 食べてもいいですか, 学生 → 学生じゃありません).
 * Each rule says what the point takes (a verb, a noun or an い-adjective), which form, and what
 * follows. The answers come from the conjugation engine, written and read. Pure.
 */
import { hasKanji } from '../kana.ts';
import type { Conjugation } from '../questions/conjugate.ts';
import {
  type AdjectiveForm,
  conjugateAdjective,
  conjugateVerb,
  isVerbClass,
  type VerbForm,
} from './forms.ts';

/** What a pattern attaches to. */
export type PatternTakes = 'verb' | 'noun' | 'adj-i';

export interface PatternRule {
  grammarId: string;
  takes: PatternTakes;
  /** The form of the cue before the ending (none for nouns). */
  form?: VerbForm | AdjectiveForm;
  /** Characters cut from the form before the ending: 食べない → 食べな + ければなりません. */
  cut?: number;
  /** What follows, the usual one first; an ending with kanji is listed in kana too. */
  ends: readonly string[];
  /** The shape shown in the prompt, e.g. 〜てもいいですか. */
  shape: string;
}

const verb = (grammarId: string, form: VerbForm, ends: string[], shape: string): PatternRule => ({
  grammarId,
  takes: 'verb',
  form,
  ends,
  shape,
});

const noun = (grammarId: string, ends: string[], shape: string): PatternRule => ({
  grammarId,
  takes: 'noun',
  ends,
  shape,
});

const adjective = (
  grammarId: string,
  form: AdjectiveForm,
  ends: string[],
  shape: string,
): PatternRule => ({ grammarId, takes: 'adj-i', form, ends, shape });

const OMOU = ['と思います', 'とおもいます'];

/** The catalogue points a pattern drill can practise, written for this app. */
export const PATTERN_RULES: readonly PatternRule[] = [
  noun('desu', ['です'], '〜です'),
  noun('ja-nai', ['じゃありません', 'ではありません', 'じゃないです'], '〜じゃありません'),
  noun('deshita', ['でした'], '〜でした'),
  noun('ka-question', ['ですか'], '〜ですか'),
  verb('masu', 'masu', [''], '〜ます'),
  verb('masen', 'masen', [''], '〜ません'),
  verb('mashita', 'mashita', [''], '〜ました'),
  verb('masen-deshita', 'masenDeshita', [''], '〜ませんでした'),
  verb('nai-form', 'nai', [''], '〜ない'),
  verb('ta-form', 'ta', [''], '〜た'),
  verb('mashou', 'mashou', [''], '〜ましょう'),
  verb('masen-ka', 'masen', ['か'], '〜ませんか'),
  verb('mashou-ka', 'mashou', ['か'], '〜ましょうか'),
  verb('tai', 'tai', ['です', ''], '〜たいです'),
  verb('te-kudasai', 'te', ['ください'], '〜てください'),
  verb('naide-kudasai', 'nai', ['でください'], '〜ないでください'),
  verb('te-iru', 'te', ['います'], '〜ています'),
  verb('te-mo-ii', 'te', ['もいいですか'], '〜てもいいですか'),
  verb('te-wa-ikenai', 'te', ['はいけません'], '〜てはいけません'),
  verb('ni-iku', 'stem', ['にいきます', 'に行きます'], '〜にいきます'),
  verb('deshou', 'dict', ['でしょう'], '〜でしょう'),
  adjective('adj-katta', 'kattaDesu', [''], '〜かったです'),
  adjective('adj-ku-nai', 'kunaiDesu', [''], '〜くないです'),
  verb('ta-koto-ga-aru', 'ta', ['ことがあります'], '〜たことがあります'),
  verb('koto-ga-dekiru', 'dict', ['ことができます'], '〜ことができます'),
  verb('te-shimau', 'te', ['しまいました'], '〜てしまいました'),
  verb('te-oku', 'te', ['おきます'], '〜ておきます'),
  verb('te-miru', 'te', ['みます'], '〜てみます'),
  verb('hou-ga-ii', 'ta', ['ほうがいいです'], '〜たほうがいいです'),
  verb('sugiru', 'stem', ['すぎます'], '〜すぎます'),
  verb('yasui', 'stem', ['やすいです'], '〜やすいです'),
  verb('nikui', 'stem', ['にくいです'], '〜にくいです'),
  verb('you-to-omou', 'volitional', OMOU, '〜ようと思います'),
  verb('tsumori', 'dict', ['つもりです'], '〜つもりです'),
  verb('kamoshirenai', 'dict', ['かもしれません'], '〜かもしれません'),
  verb('hazu', 'dict', ['はずです'], '〜はずです'),
  verb('n-desu', 'dict', ['んです'], '〜んです'),
  verb('to-omou', 'dict', OMOU, '〜と思います'),
  verb('you-ni-naru', 'potential', ['ようになりました'], '〜ようになりました'),
  verb('passive', 'passive', [''], '〜(ら)れる'),
  verb('causative', 'causative', [''], '〜(さ)せる'),
  verb('imperative', 'imperative', [''], '〜ろ／〜え'),
  verb('tara', 'tara', [''], '〜たら'),
  verb('ba', 'ba', [''], '〜ば'),
  { ...verb('nakereba-naranai', 'nai', ['ければなりません'], '〜なければなりません'), cut: 1 },
  { ...verb('nakute-mo-ii', 'nai', ['くてもいいです'], '〜なくてもいいです'), cut: 1 },
];

/** The rule for a grammar point, if it has pattern drills. */
export function patternRule(grammarId: string): PatternRule | undefined {
  return PATTERN_RULES.find((rule) => rule.grammarId === grammarId);
}

/** A cue word: its dictionary form as written and as read, and how it conjugates. */
export interface Cue {
  written: string;
  reading: string;
  /** Undefined for a noun. */
  cls?: Conjugation | undefined;
}

/** Whether `cue` is the kind of word `rule` takes. */
export function takesCue(rule: PatternRule, cue: Cue): boolean {
  if (rule.takes === 'noun') return cue.cls === undefined;
  if (cue.cls === undefined) return false;
  if (rule.takes === 'adj-i') return cue.cls === 'adj-i' || cue.cls === 'adj-ix';
  return isVerbClass(cue.cls);
}

function formsOf(rule: PatternRule, dict: string, cls: Conjugation | undefined): string[] {
  if (rule.takes === 'noun' || !rule.form) return [dict];
  if (cls === undefined) return [];
  const forms =
    rule.takes === 'adj-i'
      ? conjugateAdjective(dict, cls, rule.form as AdjectiveForm)
      : conjugateVerb(dict, cls, rule.form as VerbForm);
  const cut = rule.cut ?? 0;
  return forms.map((form) => (cut > 0 ? form.slice(0, -cut) : form));
}

const withEnds = (heads: readonly string[], ends: readonly string[]) =>
  heads.flatMap((head) => ends.map((end) => head + end));

/** A transformed cue: the model answer as written and as read, and every answer accepted. */
export interface PatternAnswer {
  written: string;
  reading: string;
  accepted: string[];
}

/**
 * The cue with the pattern applied, or undefined when the rule does not take the cue or the
 * form does not exist for it. Answers typed in kana match the reading; answers typed with an
 * IME match the written form.
 */
export function applyPattern(rule: PatternRule, cue: Cue): PatternAnswer | undefined {
  if (!takesCue(rule, cue)) return undefined;
  const heads = formsOf(rule, cue.written, cue.cls);
  const readHeads = formsOf(rule, cue.reading, cue.cls);
  const kanaEnds = rule.ends.filter((end) => !hasKanji(end));
  const model = withEnds(heads, rule.ends)[0];
  const kana = withEnds(readHeads, kanaEnds.length > 0 ? kanaEnds : rule.ends)[0];
  if (model === undefined || kana === undefined) return undefined;
  const all = withEnds([...readHeads, ...heads], rule.ends);
  return { written: model, reading: kana, accepted: [...new Set([kana, model, ...all])] };
}
