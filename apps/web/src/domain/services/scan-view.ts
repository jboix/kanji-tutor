/**
 * A scanned lesson's items as the review screen and the lesson page show them: the meaning,
 * readings and JLPT level from our data, and the learner's state from the knowledge levels
 * (K2, K3). An item not in our lists keeps the tutor's gloss and its reading as checked.
 */

import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { FUNCTION_WORDS } from '../grammar/function-words.ts';
import type { JlptLevel } from '../learner-view.ts';
import type { Repos } from '../repos.ts';
import type { ScanItem, ScannedLesson } from '../scan-types.ts';
import type { Kanji, KnowledgeLevel, LearnerLevel, Word } from '../types.ts';
import { type LearnedState, stateOf } from './learned.ts';
import { learnerLevelOf } from './learner-level.ts';
import { scanItemKey } from './scans.ts';

export interface ScanItemView {
  /** The item's key in the lesson's progress (`scanItemKey`). */
  key: string;
  kind: ScanItem['kind'];
  /** The kanji, the word as the dictionary writes it, or the grammar pattern. */
  text: string;
  /** The word's reading, or the kanji's readings (セイ・は(れる)). */
  reading?: string;
  /** False for a reading from the tutor that `verifyReading` did not confirm. */
  readingVerified: boolean;
  /** The first meaning, in English (or the tutor's gloss for an item not in our lists). */
  meaning?: string;
  /** The word's first meaning in installed languages (N9). */
  meaningByLang?: Record<string, string>;
  jlpt?: JlptLevel;
  state: LearnedState;
  /** False when our dictionary or catalogue does not have it. */
  inLists: boolean;
  page: number;
  /** For a grammar point: pack sentences at the learner's level that use it, up to 99. */
  sentences?: number;
}

/** Sentences counted for a grammar point, at most. */
const SENTENCE_COUNT_CAP = 99;

/** On readings first, then kun with okurigana in brackets: セイ・は(れる). */
export function kanjiReadings(kanji: Kanji): string {
  const kun = kanji.kun.slice(0, 2).map((r) => r.replace(/\.(.+)$/u, '($1)'));
  return [...kanji.on.slice(0, 2), ...kun].join('・');
}

interface Levels {
  words: ReadonlyMap<string, KnowledgeLevel>;
  kanji: ReadonlyMap<string, KnowledgeLevel>;
  grammar: ReadonlyMap<string, KnowledgeLevel>;
  learner: LearnerLevel;
}

/** A kanji's level: its best derived reading (K3), or its own card's. */
async function kanjiLevels(repos: Repos): Promise<Map<string, KnowledgeLevel>> {
  const levels = new Map<string, KnowledgeLevel>();
  const raise = (char: string, level: KnowledgeLevel) =>
    levels.set(char, Math.max(levels.get(char) ?? 0, level) as KnowledgeLevel);
  for (const row of await repos.kanjiReadings.all()) raise(row.kanji, row.level);
  for (const item of await repos.items.byKind('kanji')) raise(item.ref, item.level);
  return levels;
}

async function learnerLevels(repos: Repos): Promise<Levels> {
  const byRef = async (kind: 'word' | 'grammar') =>
    new Map((await repos.items.byKind(kind)).map((item) => [item.ref, item.level]));
  return {
    words: await byRef('word'),
    grammar: await byRef('grammar'),
    kanji: await kanjiLevels(repos),
    learner: learnerLevelOf(await repos.settings.get()),
  };
}

function base(item: ScanItem): ScanItemView {
  const view: ScanItemView = {
    key: scanItemKey(item),
    kind: item.kind,
    text: item.text,
    readingVerified: item.reading?.verified ?? true,
    state: 'not-started',
    inLists: item.ref !== undefined,
    page: item.page,
  };
  if (item.reading) view.reading = item.reading.reading;
  if (item.meaning) view.meaning = item.meaning;
  return view;
}

function kanjiView(view: ScanItemView, kanji: Kanji | undefined, levels: Levels): ScanItemView {
  if (!kanji) return view;
  const out: ScanItemView = { ...view, reading: kanjiReadings(kanji), readingVerified: true };
  if (kanji.meanings.length > 0) out.meaning = kanji.meanings.slice(0, 2).join(', ');
  if (kanji.jlpt) out.jlpt = kanji.jlpt;
  return { ...out, state: stateOf(levels.kanji.get(kanji.char)) };
}

function localMeanings(word: Word): Record<string, string> | undefined {
  const local = Object.entries(word.glossesByLang ?? {}).flatMap(([lang, glosses]) =>
    glosses[0] ? [[lang, glosses[0]] as const] : [],
  );
  return local.length > 0 ? Object.fromEntries(local) : undefined;
}

function wordView(view: ScanItemView, word: Word | undefined, levels: Levels): ScanItemView {
  if (!word) return view;
  const text = word.forms.includes(view.text) ? view.text : (word.forms[0] ?? view.text);
  const out: ScanItemView = { ...view, text, readingVerified: true };
  if (word.readings[0]) out.reading = word.readings[0];
  if (word.glosses[0]) out.meaning = word.glosses[0];
  const local = localMeanings(word);
  if (local) out.meaningByLang = local;
  if (word.jlpt) out.jlpt = word.jlpt;
  return { ...out, state: stateOf(levels.words.get(word.id)) };
}

const POINTS = new Map(
  [...GRAMMAR_CATALOGUE, ...FUNCTION_WORDS].map((point) => [point.id, point] as const),
);

/** A point needs no learning when tracked as known, or easier than the learner's level (G4). */
function grammarState(ref: string, level: number | undefined, levels: Levels): LearnedState {
  const tracked = levels.grammar.get(ref);
  if (tracked !== undefined) return stateOf(tracked);
  return level !== undefined && level > levels.learner ? 'known' : 'not-started';
}

async function grammarView(
  repos: Repos,
  view: ScanItemView,
  ref: string | undefined,
  levels: Levels,
) {
  const point = ref === undefined ? undefined : POINTS.get(ref);
  if (!(point && ref)) return view;
  const query = { maxLevel: levels.learner, limit: SENTENCE_COUNT_CAP };
  const sentences = (await repos.sentences.withGrammar(ref, query)).length;
  const out: ScanItemView = { ...view, text: point.pattern, meaning: point.meaning, sentences };
  out.jlpt = point.level;
  return { ...out, state: grammarState(ref, point.level, levels) };
}

async function describe(repos: Repos, items: readonly ScanItem[], levels: Levels) {
  const refs = (kind: ScanItem['kind']) =>
    items.map((item) => (item.kind === kind && item.ref ? item.ref : ''));
  const kanji = await repos.dictionary.kanjiMany(refs('kanji'));
  const words = await repos.dictionary.words(refs('word'));
  return Promise.all(
    items.map((item, i) => {
      const view = base(item);
      if (item.kind === 'kanji') return kanjiView(view, kanji[i], levels);
      if (item.kind === 'word') return wordView(view, words[i], levels);
      return grammarView(repos, view, item.ref, levels);
    }),
  );
}

/** The lesson's items, described (see the module comment), in the lesson's order. */
export async function describeScanItems(
  repos: Repos,
  lesson: Pick<ScannedLesson, 'items'>,
): Promise<ScanItemView[]> {
  return describe(repos, lesson.items, await learnerLevels(repos));
}
