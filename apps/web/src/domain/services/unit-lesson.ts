/**
 * The cards of a unit lesson's 言葉, 文法 and まとめ sections (S3), over the `Repos` port. 言葉
 * reads each new word (with its intro card, L1) and checks its meaning; 文法 explains each point
 * and drills it two to four times, then for a point with dialogues has a line of one completed;
 * まとめ brings back every word and point that has come back
 * fewer than three times, each time in a type it has not had. The 練習 and 読み物 sections are
 * sessions of their own (see `buildSession`).
 */
import { classOf } from '../conjugation/forms.ts';
import { lessonCloze } from '../drills/index.ts';
import { seededOrder } from '../drills/seed.ts';
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import type { GrammarEntry } from '../grammar/types.ts';
import { hasKanji } from '../kana.ts';
import type { Repos } from '../repos.ts';
import type { SessionCard, Target } from '../session-types.ts';
import { type Unit, unitById } from '../themes/index.ts';
import type { LearnerLevel, Sentence, Word } from '../types.ts';
import { dialogueCard } from './dialogue-card.ts';
import { drillCard } from './drills.ts';
import {
  buildCard,
  conjugationCard,
  type ExerciseMaterial,
  exerciseMaterial,
  listeningCard,
  meaningCard,
  particleCard,
  patternCard,
  sentenceMeaningCard,
} from './exercise-material.ts';
import { grammarIntroCard } from './grammar-intro.ts';
import { DAY_MS } from './items.ts';
import { learnerLevelOf } from './learner-level.ts';
import {
  COMES_BACK,
  type Coverage,
  countCard,
  coverageOf,
  type ExerciseType,
} from './lesson-sections.ts';
import { cardType } from './session-mix.ts';
import { asUnitWrites } from './unit-words.ts';

/** What a lesson is built from. */
export interface LessonData {
  unit: Unit;
  words: Word[];
  /** The passage lines, tokenized by the packs, then the unit's pack sentences. */
  lines: Sentence[];
  /** The learner's word levels (the material's count the lesson's words as met). */
  levels: ReadonlyMap<string, number>;
  m: ExerciseMaterial;
}

export interface LessonOptions {
  now: number;
  listening: boolean;
}

async function lessonLines(repos: Repos, ids: readonly string[]): Promise<Sentence[]> {
  const found = (await repos.sentences.getMany(ids)).flatMap((s) => s ?? []);
  return found.filter((s) => s.verified);
}

/** The unit's words, lines and exercise material; undefined when the packs lack the unit. */
export async function lessonData(
  repos: Repos,
  unitId: string,
  options: LessonOptions,
): Promise<LessonData | undefined> {
  const unit = unitById(unitId);
  const pack = await repos.units.get(unitId);
  if (!unit || !pack) return undefined;
  const entries = (await repos.dictionary.words(pack.wordIds)).flatMap((w) => w ?? []);
  const words = entries.map((word) => asUnitWrites(word, unit.words));
  const lines = await lessonLines(repos, [...pack.passageIds, ...pack.sentenceIds]);
  const items = await repos.items.byKind('word');
  const levels = new Map(items.map((item) => [item.ref, item.level]));
  const level: LearnerLevel = learnerLevelOf(await repos.settings.get());
  const seed = `lesson|${unitId}|${Math.floor(options.now / DAY_MS)}`;
  const ctx = { repos, level, levels, seed, listening: options.listening };
  return { unit, words, lines, levels, m: await exerciseMaterial(ctx, words) };
}

/** A word on its own as a reading card, so its intro card (L1) and typed reading come first. */
export function wordCard(
  word: Word,
  level: Unit['level'],
  known: boolean,
): SessionCard | undefined {
  const surface = word.forms[0];
  const reading = word.readings[0];
  if (!surface || !reading || !hasKanji(surface)) return undefined;
  const sentence: Sentence = {
    id: `unit-word:${word.id}`,
    text: surface,
    source: 'unit',
    tokens: [{ surface, reading, base: surface, pos: 'noun', start: 0, wordId: word.id }],
    wordIds: [word.id],
    verified: true,
    level,
  };
  const variants = word.variants ?? [];
  const target: Target = {
    tokenIndex: 0,
    itemId: `word:${word.id}`,
    wordId: word.id,
    surface,
    readings: [reading, ...variants],
    ...(variants.length > 0 ? { variants } : {}),
  };
  return { sentence, targets: [target], reason: known ? 'due' : 'new' };
}

/** Kana words spread among the kanji words, so their meaning checks do not come in a row. */
function spreadWords(words: readonly Word[]): Word[] {
  const kanji = words.filter((w) => hasKanji(w.forms[0] ?? ''));
  const kana = words.filter((w) => !kanji.includes(w));
  const every = Math.max(1, Math.ceil(kanji.length / (kana.length + 1)));
  const out: Word[] = [];
  kanji.forEach((word, i) => {
    out.push(word);
    if ((i + 1) % every === 0 && kana.length > 0) out.push(kana.shift() as Word);
  });
  return [...out, ...kana];
}

/** 言葉: each word read (kanji words), its meaning checked one card later. */
export function wordsSection(data: LessonData): SessionCard[] {
  const out: SessionCard[] = [];
  let pending: SessionCard | undefined;
  for (const word of spreadWords(data.words)) {
    const reading = wordCard(word, data.unit.level, (data.levels.get(word.id) ?? 0) >= 1);
    if (reading) out.push(reading);
    if (pending) out.push(pending);
    pending = meaningCard(data.m, word);
  }
  return pending ? [...out, pending] : out;
}

/** The lines that use a grammar point or a word, passage lines first. */
function linesWith(data: LessonData, key: string): Sentence[] {
  const [kind, id] = key.split(':') as [string, string];
  return data.lines.filter((line) =>
    kind === 'grammar' ? line.grammarIds?.includes(id) : line.wordIds.includes(id),
  );
}

const entryOf = (id: string) => GRAMMAR_CATALOGUE.find((entry) => entry.id === id);

/** Choices for a lesson cloze: the unit's other points, then the level's in the same family. */
function clozeOthers(data: LessonData, entry: GrammarEntry): GrammarEntry[] {
  const unit = data.unit.grammar.flatMap((id) => entryOf(id) ?? []);
  const family = GRAMMAR_CATALOGUE.filter(
    (e) => e.family === entry.family && e.level >= data.m.level,
  );
  return [...unit, ...family];
}

async function clozeFor(data: LessonData, grammarId: string) {
  const entry = entryOf(grammarId);
  if (!entry) return undefined;
  const others = clozeOthers(data, entry);
  for (const sentence of linesWith(data, `grammar:${grammarId}`)) {
    const drill = lessonCloze({ sentence, entry, others, seed: data.m.seed });
    if (drill) return drillCard(drill);
  }
  return undefined;
}

async function firstLine(
  lines: readonly Sentence[],
  make: (line: Sentence) => Promise<SessionCard | undefined>,
) {
  for (const line of lines) {
    const card = await make(line);
    if (card) return card;
  }
  return undefined;
}

/** Two pattern drills on different cues, a line to build and, when those are short, a cloze. */
async function pointDrills(data: LessonData, grammarId: string): Promise<SessionCard[]> {
  const asked = new Set<string>();
  const drills: SessionCard[] = [];
  for (let i = 0; i < 2; i++) {
    const card = patternCard(data.m, grammarId, asked);
    if (card?.drill?.kind !== 'pattern') break;
    asked.add(card.drill.cue.wordId ?? card.drill.cue.written);
    drills.push(card);
  }
  const lines = linesWith(data, `grammar:${grammarId}`);
  const build = await firstLine(lines, (line) => buildCard(data.m, line, `grammar:${grammarId}`));
  if (build) drills.push(build);
  const cloze = drills.length < 2 ? await clozeFor(data, grammarId) : undefined;
  return cloze ? [...drills, cloze] : drills;
}

/** 文法: each point's explanation and examples, then its drills, then a line of its dialogues. */
export async function grammarSection(data: LessonData): Promise<SessionCard[]> {
  const out: SessionCard[] = [];
  for (const id of data.unit.grammar) {
    out.push(grammarIntroCard(id), ...(await pointDrills(data, id)));
    const dialogue = await dialogueCard(id, data.m.seed);
    if (dialogue) out.push(dialogue);
  }
  return out;
}

/** The lesson's items: its words and grammar points, as item keys. */
export function lessonItems(data: Pick<LessonData, 'unit' | 'words'>): string[] {
  return [
    ...data.words.map((w) => `word:${w.id}`),
    ...data.unit.grammar.map((g) => `grammar:${g}`),
  ];
}

type Maker = (data: LessonData, key: string) => Promise<SessionCard | undefined>;

const wordOf = (data: LessonData, key: string) => data.words.find((w) => `word:${w.id}` === key);

/** A pattern drill with the word as its cue, on one of the unit's points. */
async function wordPattern(data: LessonData, key: string) {
  const word = wordOf(data, key);
  const written = word?.forms[0] ?? word?.readings[0];
  const reading = word?.readings[0];
  if (!word || !written || !reading) return undefined;
  const cls = word.pos?.includes('n') ? undefined : classOf(written, word.pos, reading);
  const cue = { written, reading, wordId: word.id, cls };
  const m = { ...data.m, cues: [] };
  return data.unit.grammar.map((g) => patternCard(m, g, new Set(), [cue])).find(Boolean);
}

const MAKERS: Readonly<Record<ExerciseType, Maker | undefined>> = {
  reading: undefined,
  meaning: undefined,
  'word-choice': async (data, key) => {
    const word = wordOf(data, key);
    return word && meaningCard(data.m, word, true);
  },
  particle: (data, key) => particleCard(data.m, linesWith(data, key)),
  build: (data, key) => firstLine(linesWith(data, key), (line) => buildCard(data.m, line)),
  listening: (data, key) =>
    firstLine(linesWith(data, key), (line) => listeningCard(data.m, line, data.lines)),
  'sentence-meaning': (data, key) =>
    firstLine(linesWith(data, key), (line) => sentenceMeaningCard(data.m, line, data.lines)),
  pattern: async (data, key) =>
    key.startsWith('grammar:') ? patternCard(data.m, key.slice(8)) : wordPattern(data, key),
  conjugation: async (data, key) => {
    const verb = data.m.verbs.find((v) => `word:${v.wordId}` === key);
    return verb && conjugationCard({ ...data.m, verbs: [verb] });
  },
  cloze: (data, key) =>
    key.startsWith('grammar:') ? clozeFor(data, key.slice(8)) : Promise.resolve(undefined),
  // Writing a word met minutes ago is too early: daily sessions write words already read.
  write: undefined,
};

/** The types tried for an item in まとめ, in order. */
const TOP_UP: readonly ExerciseType[] = [
  'listening',
  'particle',
  'build',
  'cloze',
  'sentence-meaning',
  'pattern',
  'conjugation',
  'word-choice',
];

/** A card that brings the item back in a type it has not had, not already in the review. */
/** The types to try for the n-th item, turned by n, so the review mixes them. */
const topUpOrder = (n: number) => [
  ...TOP_UP.slice(n % TOP_UP.length),
  ...TOP_UP.slice(0, n % TOP_UP.length),
];

async function topUp(data: LessonData, key: string, coverage: Coverage, made: Set<string>) {
  const had = coverage.get(key) ?? new Set();
  const n = lessonItems(data).indexOf(key);
  for (const type of topUpOrder(n).filter((t) => !had.has(t))) {
    const card = await MAKERS[type]?.(data, key);
    const id = card && `${cardType(card)}:${card.sentence.id}`;
    if (!card || !id || made.has(id)) continue;
    made.add(id);
    return card;
  }
  return undefined;
}

/** Conjugation drills on the lesson's verbs, two at most: a wrap-up works their forms too. */
function verbDrills(data: LessonData): SessionCard[] {
  const ids = new Set(data.words.map((w) => w.id));
  const verbs = data.m.verbs.filter((v) => ids.has(v.wordId)).slice(0, 2);
  return verbs.flatMap((verb) => conjugationCard({ ...data.m, verbs: [verb] }) ?? []);
}

/**
 * まとめ: conjugation drills on the lesson's verbs, then for each item short of three types
 * after 言葉 and 文法 (and this review so far), a card of a type it has not had, in a seeded
 * order without long runs of one type.
 */
export async function reviewSection(data: LessonData, before: readonly SessionCard[]) {
  const out: SessionCard[] = verbDrills(data);
  const coverage = coverageOf([...before, ...out], lessonItems(data));
  const made = new Set<string>();
  for (const key of lessonItems(data)) {
    while ((coverage.get(key)?.size ?? 0) < COMES_BACK) {
      const card = await topUp(data, key, coverage, made);
      if (!card) break;
      out.push(card);
      countCard(coverage, card);
    }
  }
  return withoutRuns(seededOrder(out, (c) => `${cardType(c)}:${c.sentence.id}`, data.m.seed));
}

/** Moves a card that would make three of a type in a row behind the next card of another type. */
export function withoutRuns(cards: readonly SessionCard[]): SessionCard[] {
  const left = [...cards];
  const out: SessionCard[] = [];
  while (left.length > 0) {
    const run = (type: string) =>
      out.slice(-2).every((c) => cardType(c) === type) && out.length >= 2;
    const at = left.findIndex((card) => !run(cardType(card)));
    out.push(...left.splice(Math.max(0, at), 1));
  }
  return out;
}
