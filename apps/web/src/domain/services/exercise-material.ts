/**
 * What the S4 exercises are made from, over the `Repos` port: other meanings from the units'
 * words at the learner's level, cue words for pattern and conjugation drills (the lesson's,
 * then words the learner has met), and makers that turn a word, a grammar point or a sentence
 * into an exercise card. Every sentence passes the level check of J6 (`fitsLevel`), and every
 * cue and other meaning is at or below the learner's level or already met.
 */
import { classOf, isVerbClass } from '../conjugation/forms.ts';
import {
  buildDrill,
  type CueWord,
  conjugationDrill,
  listeningDrill,
  meaningDrill,
  particleDrill,
  patternDrill,
  type WriteInput,
  wordKind,
  writeDrill,
} from '../drills/index.ts';
import { fitsLevel } from '../questions/level-fit.ts';
import type { Repos } from '../repos.ts';
import type { WordLevels } from '../session-types.ts';
import { unitById } from '../themes/index.ts';
import type { ItemId, LearnerLevel, Sentence, Word } from '../types.ts';
import { drillCard } from './drills.ts';
import { asUnitWrites } from './unit-words.ts';

export interface ExerciseContext {
  repos: Repos;
  level: LearnerLevel;
  levels: WordLevels;
  /** Changes the choices from day to day; the same seed gives the same exercises. */
  seed: string;
  /** The device has a Japanese voice: listening exercises can be made (S4). */
  listening: boolean;
}

export interface ExerciseMaterial extends ExerciseContext {
  /** Words the other meanings of a meaning check come from. */
  others: Word[];
  /** Nouns, adjectives and verbs to transform, the lesson's first. */
  cues: CueWord[];
  /** The verbs among them, for conjugation drills. */
  verbs: (CueWord & { wordId: string })[];
}

/** Known words looked at for cues, at most. */
const KNOWN_CUES = 60;

const fits = (word: Word, level: LearnerLevel, levels: WordLevels) =>
  (levels.get(word.id) ?? 0) >= 1 || (word.jlpt ?? 1) >= level;

/** A noun's cues: itself, and its する verb when it takes one (勉強 → 勉強する). */
function nounCues(base: CueWord, pos: readonly string[]): CueWord[] {
  if (!pos.includes('n')) return [];
  if (!pos.includes('vs')) return [base];
  const suru = { ...base, written: `${base.written}する`, reading: `${base.reading}する` };
  return [base, { ...suru, cls: 'vs' }];
}

/**
 * A word as cues: a verb or an い-adjective with its class, a noun without, and a noun that takes
 * する (勉強) as its する verb too (勉強する).
 */
export function cuesOf(word: Word): CueWord[] {
  const written = word.forms[0] ?? word.readings[0];
  const reading = word.readings[0];
  if (!written || !reading) return [];
  const pos = word.pos ?? [];
  const base: CueWord = { written, reading, wordId: word.id };
  if (wordKind(word) === 'other') return nounCues(base, pos);
  const cls = classOf(written, pos, reading);
  return cls ? [{ ...base, cls }] : [];
}

/** The words of the units at the learner's level or easier, as the units write them. */
async function levelWords(repos: Repos, level: LearnerLevel): Promise<Word[]> {
  const packs = (await repos.units.all()).filter((pack) => pack.level >= level);
  const lists = await Promise.all(packs.map((pack) => repos.dictionary.words(pack.wordIds)));
  return packs.flatMap((pack, i) => {
    const written = unitById(pack.id)?.words ?? [];
    return (lists[i] ?? []).flatMap((w) => (w ? [asUnitWrites(w, written)] : []));
  });
}

async function knownWords(repos: Repos, levels: WordLevels): Promise<Word[]> {
  const ids = [...levels].filter(([, level]) => level >= 1).map(([id]) => id);
  return (await repos.dictionary.words(ids.slice(0, KNOWN_CUES))).flatMap((w) => w ?? []);
}

/** The material for a session or a lesson (see the module comment). */
export async function exerciseMaterial(
  ctx: ExerciseContext,
  lesson: readonly Word[] = [],
): Promise<ExerciseMaterial> {
  const pool = await levelWords(ctx.repos, ctx.level);
  const known = await knownWords(ctx.repos, ctx.levels);
  const others = [...new Map([...lesson, ...pool].map((w) => [w.id, w])).values()];
  const cueWords = [...new Map([...lesson, ...known].map((w) => [w.id, w])).values()];
  const cues = cueWords
    .filter((w) => lesson.includes(w) || fits(w, ctx.level, ctx.levels))
    .flatMap(cuesOf);
  const verbs = cues.flatMap((c) =>
    c.cls && c.wordId && isVerbClass(c.cls) ? [{ ...c, wordId: c.wordId }] : [],
  );
  // The lesson's words are being taught: they pass the level checks as words already met.
  const levels = new Map(ctx.levels);
  for (const word of lesson) levels.set(word.id, Math.max(levels.get(word.id) ?? 0, 1) as 1);
  const usable = others.filter((w) => fits(w, ctx.level, levels));
  return { ...ctx, levels, others: usable, cues, verbs };
}

const fitCtx = (m: ExerciseMaterial) => ({
  repos: m.repos,
  levels: m.levels,
  learnerLevel: m.level,
});

/** Whether a sentence and the texts shown with it are at or below the learner's level (J6). */
export function sentenceFits(m: ExerciseMaterial, sentence: Sentence, texts: readonly string[]) {
  return fitsLevel(fitCtx(m), sentence, texts);
}

/** A meaning check on a word, reversed or not. */
export function meaningCard(m: ExerciseMaterial, word: Word, reverse = false) {
  const drill = meaningDrill({ word, others: m.others, seed: m.seed, reverse });
  return drill && drillCard(drill);
}

/** A particle fill on the first sentence that has one and fits the level. */
export async function particleCard(m: ExerciseMaterial, sentences: readonly Sentence[]) {
  for (const sentence of sentences) {
    const drill = particleDrill({ sentences: [sentence], level: m.level, seed: m.seed });
    if (drill && (await sentenceFits(m, sentence, drill.choices))) return drillCard(drill);
  }
  return undefined;
}

/** Sentence building on a sentence that fits the level. */
export async function buildCard(m: ExerciseMaterial, sentence: Sentence, itemId?: ItemId) {
  const drill = buildDrill({ sentence, seed: m.seed, itemId });
  if (!drill || !(await sentenceFits(m, sentence, []))) return undefined;
  return drillCard(drill);
}

/** A sentence meaning check: the sentence shown, and its meaning among others'. */
export async function sentenceMeaningCard(
  m: ExerciseMaterial,
  sentence: Sentence,
  others: readonly Sentence[],
  itemId?: ItemId,
) {
  const drill = listeningDrill({ sentence, others, seed: m.seed, itemId, read: true });
  if (!drill || !(await sentenceFits(m, sentence, []))) return undefined;
  return drillCard(drill);
}

/** Listening on a sentence, with other sentences' meanings; none without a Japanese voice. */
export async function listeningCard(
  m: ExerciseMaterial,
  sentence: Sentence,
  others: readonly Sentence[],
  itemId?: ItemId,
) {
  if (!m.listening) return undefined;
  const drill = listeningDrill({ sentence, others, seed: m.seed, itemId });
  if (!drill || !(await sentenceFits(m, sentence, []))) return undefined;
  return drillCard(drill);
}

/** Write the kanji of a word the card just read, in a sentence that fits the level. */
export async function writeCard(m: ExerciseMaterial, input: WriteInput) {
  const drill = writeDrill(input);
  if (!drill || !(await sentenceFits(m, input.sentence, []))) return undefined;
  return drillCard(drill);
}

/** A pattern drill on a grammar point, on a cue not asked yet (the given cues first). */
export function patternCard(
  m: ExerciseMaterial,
  grammarId: string,
  exclude: ReadonlySet<string> = new Set(),
  first: readonly CueWord[] = [],
) {
  const drill = patternDrill({ grammarId, cues: [...first, ...m.cues], seed: m.seed, exclude });
  return drill && drillCard(drill);
}

/** A conjugation drill on a verb not asked yet, in a form at the learner's level. */
export function conjugationCard(m: ExerciseMaterial, exclude: ReadonlySet<string> = new Set()) {
  const drill = conjugationDrill({ verbs: m.verbs, level: m.level, seed: m.seed, exclude });
  return drill && drillCard(drill);
}
