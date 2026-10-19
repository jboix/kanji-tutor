/**
 * The shape of a grammar form as a 文法形式の判断 option (J4): what stays outside the blank (the
 * て of a te-form, the た of a past, a case particle), the core the blank holds, how the core
 * conjugates, and what the text before the blank must end in for the form to attach.
 */
import { patternText } from '../drills/cloze.ts';
import type { GrammarEntry } from '../grammar/types.ts';
import type { Sentence, Token } from '../types.ts';
import { type Realised, realiseAt } from './blank.ts';
import { type Conjugation, classOfForm, inflect } from './conjugate.ts';

/** What the text before a form ends in: a te-form, a past, a stem, a dictionary form… */
export type Attach =
  | 'te'
  | 'ta'
  | 'stem'
  | 'dict'
  | 'nai'
  | 'naistem'
  | 'plain'
  | 'noun'
  | 'adj'
  | 'adjstem';

/** Text left outside the blank, before it: the blank holds the core alone. */
export type Lead = '' | 'て' | 'た' | 'を' | 'が';

export interface FormShape {
  lead: Lead;
  core: string;
  cls: Conjugation | undefined;
  attach: ReadonlySet<Attach>;
}

/** A core this short is too little to tell a form by (the て of ても, the ら of たら). */
const MIN_CORE = 2;

const LEAD_SURFACES: Readonly<Record<Exclude<Lead, ''>, readonly string[]>> = {
  て: ['て', 'で'],
  た: ['た', 'だ'],
  を: ['を'],
  が: ['が'],
};

const ATTACH_WORDS: readonly [RegExp, Attach][] = [
  [/V-て/u, 'te'],
  [/V-stem|V-ます/u, 'stem'],
  [/V-dictionary/u, 'dict'],
  [/V-た(?!ら)/u, 'ta'],
  [/V-ない stem/u, 'naistem'],
  [/V-ない(?! stem)/u, 'nai'],
  [/plain form/u, 'plain'],
  [/(^|[\s/])(N|amount|time|number|person)(?=[\s/]|$)/u, 'noun'],
  [/い-adj \(drop い\)/u, 'adjstem'],
  [/い-adj(?! \()/u, 'adj'],
];

/** The formation's segments before the one that writes the form (person + に + V-て | もらう). */
function attachText(formation: string, written: string): string {
  const parts = formation.split(' + ');
  const keys = [written.slice(0, 2), written.slice(1, 3)];
  const at = parts.findIndex((p, i) => i > 0 && keys.some((k) => k.length === 2 && p.includes(k)));
  return parts.slice(0, at > 0 ? at : -1).join(' + ');
}

/** What a form attaches to, read from its formation ("V-dictionary / V-ない + ことにする"). */
export function attachOf(formation: string, written: string): Set<Attach> {
  const text = attachText(formation, written);
  const flat = text.replace(/\s*\((?!drop)[^)]*\)/gu, '');
  const kinds = new Set(ATTACH_WORDS.flatMap(([re, kind]) => (re.test(flat) ? [kind] : [])));
  // A form written with its ない (ないでください) follows the ない stem (食べ, 行か).
  if (kinds.delete('nai')) kinds.add(written.startsWith('な') ? 'naistem' : 'nai');
  return kinds;
}

/** The pattern's written alternatives: 〜くなる／〜になる → くなる, になる. */
export function writtenForms(entry: GrammarEntry): string[] {
  return entry.pattern
    .split('／')
    .map((p) => patternText(p.replace(/\s*[(（][^)）]*[)）]/gu, '')))
    .filter((t) => t.length >= MIN_CORE && !/[A-Za-z+]/u.test(t));
}

function leadOf(written: string, attach: ReadonlySet<Attach>): Lead {
  const first = written.charAt(0);
  if ((first === 'て' || first === 'で') && attach.has('te')) return 'て';
  if ((first === 'た' || first === 'だ') && attach.has('ta')) return 'た';
  if (first === 'を' || first === 'が') return first;
  return '';
}

const SHAPES = new WeakMap<GrammarEntry, FormShape[]>();

/** Every shape the point can take as an option, one per written alternative (cached). */
export function shapesOf(entry: GrammarEntry): FormShape[] {
  const cached = SHAPES.get(entry);
  if (cached) return cached;
  const shapes = computeShapes(entry);
  SHAPES.set(entry, shapes);
  return shapes;
}

function computeShapes(entry: GrammarEntry): FormShape[] {
  return writtenForms(entry).flatMap((written) => {
    const attach = attachOf(entry.formation, written);
    const lead = leadOf(written, attach);
    const core = written.slice(lead.length);
    if (core.length < MIN_CORE || (lead === '' && attach.size === 0)) return [];
    return [{ lead, core, cls: classOfForm(core), attach }];
  });
}

const leadSurface = (lead: Lead) => (lead === '' ? [] : LEAD_SURFACES[lead]);

function verbKinds(token: Token): Attach[] {
  if (token.surface === token.base) return ['dict', 'plain'];
  const ichidan = token.base.endsWith('る') && token.surface === token.base.slice(0, -1);
  if (ichidan || token.surface.endsWith('し')) return ['stem', 'naistem'];
  const last = token.surface.slice(-1);
  if ('いきぎしちにびみり'.includes(last)) return ['stem'];
  return 'わかがさたなばまらこ'.includes(last) ? ['naistem'] : [];
}

/** What an auxiliary ends a clause in: た/だ a past, ない a negative, たい or れる a plain form. */
const AUX_KINDS: Readonly<Record<string, readonly Attach[]>> = {
  た: ['ta', 'plain'],
  だ: ['ta', 'plain'],
  ない: ['plain', 'nai'],
  たい: ['plain'],
  れる: ['plain'],
  られる: ['plain'],
  せる: ['plain'],
  させる: ['plain'],
};

const BY_POS: Readonly<Record<string, (t: Token) => readonly Attach[]>> = {
  particle: (t) => (t.surface === 'て' || t.surface === 'で' ? ['te'] : []),
  auxiliary: (t) => AUX_KINDS[t.surface] ?? [],
  verb: verbKinds,
  adjective: (t) => (t.surface === t.base ? ['plain', 'adj'] : ['adjstem']),
  noun: () => ['noun'],
  pronoun: () => ['noun'],
};

const tokenKinds = (t: Token) => BY_POS[t.pos]?.(t) ?? [];

/** What the token before index `k` ends in, as attachments a form could take. */
export function kindsBefore(tokens: readonly Token[], k: number): Set<Attach> {
  const t = tokens[k - 1];
  // だ after a noun is the copula (女優だ), not a past: 女優だようだ is no Japanese.
  const copula = t?.surface === 'だ' && tokens[k - 2]?.pos !== 'verb';
  return new Set(t && !copula ? tokenKinds(t) : []);
}

/** True when the shape can follow the token before index `k`. */
export function attaches(shape: FormShape, tokens: readonly Token[], k: number): boolean {
  if (shape.lead !== '') return leadSurface(shape.lead).includes(tokens[k - 1]?.surface ?? '');
  const before = kindsBefore(tokens, k);
  return [...shape.attach].some((kind) => before.has(kind));
}

/** The shape as written from token `k` on (see {@link realiseAt}). */
export const realise = (sentence: Sentence, k: number, shape: FormShape) =>
  realiseAt(sentence, k, shape.core, shape.cls);

/**
 * The shape written to fill the same blank as `answer`: the same inflection for a form that
 * conjugates, the same last kana for one that does not (ために, ように). Undefined when it
 * cannot take that shape.
 */
export function fillFor(shape: FormShape, answer: Realised, answerShape: FormShape) {
  if (shape.lead !== answerShape.lead || teAruNegative(shape, answer)) return undefined;
  if (answer.inflection === undefined || !shape.cls) return bareFill(shape, answer);
  return inflect(shape.core, shape.cls, answer.inflection)[0];
}

/** してない is ていない said fast, not てある negated: it would be right too. */
const teAruNegative = (shape: FormShape, answer: Realised) =>
  shape.lead === 'て' &&
  shape.cls === 'v5r-i' &&
  (answer.inflection === 'neg' || answer.inflection === 'negPast');

/** A form that does not conjugate fills a blank that does not either, ending the same way. */
function bareFill(shape: FormShape, answer: Realised): string | undefined {
  const same = !shape.cls && answer.inflection === undefined;
  return same && shape.core.slice(-1) === answer.text.slice(-1) ? shape.core : undefined;
}
