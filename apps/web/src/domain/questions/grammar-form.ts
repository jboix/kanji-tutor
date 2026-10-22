/**
 * 文法形式の判断 (J4): a sentence with a detected grammar form blanked, and four forms that fill
 * the same slot: the right one and three of the same family, then the same level, whose meaning
 * differs from it. Each option is explained with the catalogue's meaning and formation.
 *
 * The blank covers whole tokens: the form with the ending it is written with (もらいました, not
 * もら). What all options share stays outside it (the て of a te-form, the を before a giving
 * verb), and every distractor is conjugated like the answer and attaches to the same text.
 */
import { patternText } from '../drills/cloze.ts';
import { seededOrder } from '../drills/seed.ts';
import { detectEntries } from '../grammar/detect.ts';
import type { GrammarEntry, GrammarFamily, GrammarMatch } from '../grammar/types.ts';
import { itemId } from '../ids.ts';
import type { Sentence } from '../types.ts';
import type { Realised } from './blank.ts';
import { frameBefore, GIVING_VARIANTS, givingAllowed, isGiving } from './giving.ts';
import {
  attaches,
  type FormShape,
  fillFor,
  kindsBefore,
  realise,
  shapesOf,
} from './grammar-shape.ts';
import { arrange, meaningFields, meaningWords, OPTION_COUNT, optionKey } from './options.ts';
import { questionId, stemOf } from './stem.ts';
import { type ChoiceQuestion, note, type QuestionOption, SECTION } from './types.ts';

export interface GrammarFormInput {
  sentence: Sentence;
  catalogue: readonly GrammarEntry[];
  /** Points distractors come from; the catalogue when not given (one level harder is fine). */
  pool?: readonly GrammarEntry[];
  /** Points to blank first (the learner's, due or planned). */
  prefer?: readonly string[];
  /** Points not to blank (above the learner's level, or already asked). */
  skip?: ReadonlySet<string>;
  /** Whether a sentence exists in the packs: a distractor that makes one fits too. */
  known?: (text: string) => boolean;
  seed: string;
}

/**
 * Families where another member often fits the same blank (です/だ, よ/ね, plain or polite
 * forms, ましょう/ませんか): never blanked. And detectors known to be weak (D39), or points
 * the sentence would be right without (んです): never trusted for a question.
 */
const AMBIGUOUS: ReadonlySet<GrammarFamily> = new Set([
  'copula',
  'politeness',
  'plain-form',
  'sentence-ending',
  'honorific',
  'quotation',
  'suggestion',
]);
const WEAK: ReadonlySet<string> = new Set([
  'imperative',
  'to-conditional',
  'toki',
  'uchi-ni',
  'n-desu',
]);

/** Points that fit the same slot with the same sense (ければならない, ないといけない…). */
const INTERCHANGEABLE: readonly (readonly string[])[] = [
  ['nakereba-naranai', 'nakute-wa-ikenai', 'nai-to-ikenai', 'nakya'],
  ['deshou', 'darou', 'hazu'],
  ['you-da', 'mitai', 'rashii', 'ppoi', 'rashii-typical'],
  ['kara-reason', 'node'],
  ['kedo', 'ga-but'],
  ['te-shimau', 'chau'],
  ['te-oku', 'toku'],
  ['te-iru', 'te-ru'],
  ['tara', 'ba', 'to-conditional', 'nara'],
  ['aida', 'aida-ni', 'uchi-ni'],
  ['tabi-ni', 'goto-ni'],
  ['te-mo-ii', 'te-mo-kamawanai'],
  ['tame-ni', 'you-ni'],
  ['tsumori', 'yotei', 'you-to-omou', 'tokoro-da'],
  ['tokoro-da', 'ta-tokoro', 'ta-bakari'],
  ['hajimeru', 'dasu'],
  ['ni-tsuite', 'ni-kanshite'],
  ['ni-yotte', 'ni-yoru-to'],
  ['to-iu', 'tte'],
  ['hazu-ga-nai', 'wake-ga-nai'],
  ['ni-chigainai', 'ni-kimatte-iru', 'hazu'],
  ['rashii', 'sou-hearsay'],
];

/**
 * Families whose forms read as another right answer next to one of these, through a loose
 * translation (雨になる / 雨みたいだ, 留守にする / 留守の予定だ).
 */
const NEAR: Readonly<Partial<Record<GrammarFamily, readonly GrammarFamily[]>>> = {
  change: ['appearance', 'intention', 'conjecture'],
  decision: ['intention', 'appearance'],
};

/** Aspect forms a conditional blurs: 洗ってしまったら and 洗っておいたら both say "once washed". */
const COMPLETED: ReadonlySet<string> = new Set(['te-shimau', 'te-oku', 'chau', 'toku', 'te-iru']);
const CONDITIONAL = new Set(['tara', 'ba']);

/** Points so common that a session would see little else: asked after the others. */
const COMMON: ReadonlySet<string> = new Set(['te-iru', 'tai']);

/** Families that end a sentence's thought (でしょう, ようだ, はずがない): nothing follows them but a particle. */
const CLOSING: ReadonlySet<GrammarFamily> = new Set([
  'conjecture',
  'appearance',
  'certainty',
  'explanation',
]);
/** What may follow a closing form: the end, punctuation and final or linking particles. */
const AFTER_CLOSING = new Set([
  'よ',
  'ね',
  'な',
  'か',
  'けど',
  'が',
  'から',
  'し',
  'と',
  'って',
  'わ',
  'ぞ',
]);

const MEANINGS = new WeakMap<GrammarEntry, Set<string>>();

/** `sameMeaning` on two points, with each point's meaning words worked out once. */
function sharesMeaning(a: GrammarEntry, b: GrammarEntry): boolean {
  const words = (e: GrammarEntry) => {
    const found = MEANINGS.get(e) ?? meaningWords([e.meaning]);
    MEANINGS.set(e, found);
    return found;
  };
  const theirs = words(b);
  return [...words(a)].some((w) => theirs.has(w));
}

const usable = (entry: GrammarEntry) => !AMBIGUOUS.has(entry.family) && !WEAK.has(entry.id);

const interchangeable = (a: string, b: string) =>
  INTERCHANGEABLE.some((group) => group.includes(a) && group.includes(b));

/** Whether the candidate could pass for right next to the answer in this slot. */
function blurs(answer: GrammarEntry, candidate: GrammarEntry, slot: Slot): boolean {
  if (interchangeable(answer.id, candidate.id)) return true;
  if (NEAR[answer.family]?.includes(candidate.family)) return true;
  const conditional = CONDITIONAL.has(slot.realised.inflection ?? '');
  return conditional && COMPLETED.has(answer.id) && COMPLETED.has(candidate.id);
}

/** How a point is written as an option: its pattern without 〜, notes or alternatives. */
export function formText(entry: GrammarEntry): string {
  const first = entry.pattern.split('／')[0] ?? '';
  const text = patternText(first.replace(/\s*[(（][^)）]*[)）]/gu, ''));
  return text.length >= 2 ? text : (entry.cloze.find((c) => c.length >= 2) ?? '');
}

const explain = (entry: GrammarEntry) => ({
  pattern: entry.pattern,
  meaning: entry.meaning,
  formation: entry.formation,
});

/** Where the answer sits: the token its core starts at, its shape and how it is written. */
interface Slot {
  entry: GrammarEntry;
  k: number;
  shape: FormShape;
  realised: Realised;
}

/** のに after a dictionary form is mostly "for" (作るのに時間がかかる), not "although". */
const misread = (entry: GrammarEntry, sentence: Sentence, k: number) =>
  entry.id === 'noni' && kindsBefore(sentence.tokens, k).has('dict');

/** The first shape of the point written whole from a token inside the detected span. */
function slotFor(entry: GrammarEntry, match: GrammarMatch, sentence: Sentence): Slot | undefined {
  for (const shape of shapesOf(entry)) {
    for (let k = match.start; k < match.end; k++) {
      const slot = slotAt(entry, shape, sentence, k);
      if (slot) return slot;
    }
  }
  return undefined;
}

function slotAt(entry: GrammarEntry, shape: FormShape, sentence: Sentence, k: number) {
  if (!attaches(shape, sentence.tokens, k) || misread(entry, sentence, k)) return undefined;
  const realised = realise(sentence, k, shape);
  return realised ? { entry, k, shape, realised } : undefined;
}

/** Whether the blank is followed by the end or a particle, so a closing form can fill it. */
function openAfter(slot: Slot, sentence: Sentence): boolean {
  const next = sentence.tokens.find((t) => t.start === slot.realised.to);
  return !next || next.pos === 'symbol' || AFTER_CLOSING.has(next.surface);
}

/** The candidate written to fill the slot, if one of its shapes can. */
function fill(candidate: GrammarEntry, slot: Slot, sentence: Sentence): string | undefined {
  const open = openAfter(slot, sentence);
  const fits = (shape: FormShape) =>
    (open || !(CLOSING.has(candidate.family) || shape.cls === 'copula')) &&
    attaches(shape, sentence.tokens, slot.k);
  for (const shape of shapesOf(candidate).filter(fits)) {
    const text = fillFor(shape, slot.realised, slot.shape);
    if (text !== undefined && text !== slot.realised.text) return text;
  }
  return undefined;
}

/** Same family or level, another meaning, not interchangeable, and not ruled in by the frame. */
function candidates(input: GrammarFormInput, slot: Slot): GrammarEntry[] {
  const { entry } = slot;
  const frame = frameBefore(input.sentence.tokens, slot.k);
  const base = input.pool ?? input.catalogue;
  const pool = isGiving(entry.id) ? [...base, ...GIVING_VARIANTS] : base;
  const others = pool.filter(
    (e) =>
      e.id !== entry.id &&
      usable(e) &&
      (e.family === entry.family || Math.abs(e.level - entry.level) <= 1) &&
      !sharesMeaning(e, entry) &&
      !blurs(entry, e, slot) &&
      givingAllowed(entry.id, e.id, frame),
  );
  const rank = (e: GrammarEntry) =>
    Number(e.family !== entry.family) * 2 + Math.abs(e.level - entry.level);
  return seededOrder(others, (e) => e.id, input.seed).sort((a, b) => rank(a) - rank(b));
}

/** The first three distinct wrong options in candidate order: `arrange` takes no more. */
function wrongOptions(input: GrammarFormInput, slot: Slot): QuestionOption[] {
  const { text } = input.sentence;
  const before = text.slice(0, slot.realised.from);
  const after = text.slice(slot.realised.to);
  const seen = new Set([optionKey(slot.realised.text)]);
  const out: QuestionOption[] = [];
  for (const e of candidates(input, slot)) {
    const filled = fill(e, slot, input.sentence);
    if (filled === undefined || seen.has(optionKey(filled))) continue;
    if (input.known?.(before + filled + after)) continue;
    seen.add(optionKey(filled));
    out.push({ text: filled, note: note('form-misfits', explain(e)) });
    if (out.length === OPTION_COUNT - 1) break;
  }
  return out;
}

function ordered(input: GrammarFormInput, matches: readonly GrammarMatch[]) {
  const prefer = new Set(input.prefer ?? []);
  const rank = (m: GrammarMatch) => (prefer.has(m.id) ? 0 : COMMON.has(m.id) ? 2 : 1);
  return seededOrder(matches, (m) => m.id, input.seed).sort((a, b) => rank(a) - rank(b));
}

function questionFor(input: GrammarFormInput, slot: Slot) {
  const { sentence } = input;
  const { entry, realised } = slot;
  const right = { text: realised.text, note: note('form-fits', explain(entry)) };
  const arranged = arrange(right, wrongOptions(input, slot), input.seed);
  if (!arranged) return undefined;
  const question: ChoiceQuestion = {
    id: questionId('grammar-form', sentence.id, entry.id),
    kind: 'grammar-form',
    section: SECTION['grammar-form'],
    stem: stemOf(sentence, realised.from, realised.to, 'blank'),
    ...arranged,
    itemId: itemId('grammar', entry.id),
    sentenceId: sentence.id,
    ...meaningFields(sentence.translation, [entry.meaning]),
  };
  return question;
}

/**
 * A 文法形式の判断 question on the first usable grammar point the sentence uses (preferred
 * points first), or undefined when none gives a sound question. Short sentences give little
 * context, so another form may also be grammatical: the sentence must have a translation,
 * shown with the question, and every distractor means something else (`sharesMeaning`).
 */
export function grammarFormQuestion(input: GrammarFormInput): ChoiceQuestion | undefined {
  if (!input.sentence.translation) return undefined;
  const byId = new Map(input.catalogue.map((e) => [e.id, e]));
  const matches = detectEntries(input.catalogue, input.sentence.tokens);
  for (const match of ordered(input, matches)) {
    const entry = byId.get(match.id);
    if (!entry || !usable(entry) || input.skip?.has(entry.id)) continue;
    const slot = slotFor(entry, match, input.sentence);
    const question = slot && questionFor(input, slot);
    if (question) return question;
  }
  return undefined;
}
