/**
 * Practising one scanned lesson, apart from the daily sessions: its items crossed with the pack
 * sentences and made into the usual cards, and the handout's own questions. A word is read in a
 * pack sentence that uses it (else alone) and its meaning checked; a kanji is read in a word
 * written with it, else on a kanji card; a grammar point gets its introduction when new and two
 * of its drills ("Practise this point"). Items not practised yet come first; answers go through
 * `scan-answer.ts`, which updates the same knowledge levels and FSRS cards as everywhere.
 */
import { kanjiCardDrill } from '../drills/index.ts';
import { hasKanji } from '../kana.ts';
import type { JlptLevel } from '../learner-view.ts';
import type { Repos } from '../repos.ts';
import type { HandoutQuestion, ScanItem, ScannedLesson } from '../scan-types.ts';
import { selectSession } from '../selector.ts';
import type { SessionCard } from '../session-types.ts';
import type { Item, KnowledgeLevel, LearnerLevel, Word } from '../types.ts';
import { drillCard } from './drills.ts';
import { type ExerciseMaterial, exerciseMaterial, meaningCard } from './exercise-material.ts';
import { grammarIntroCard, introducedGrammar } from './grammar-intro.ts';
import { DAY_MS, newWordItem } from './items.ts';
import { learnerLevelOf } from './learner-level.ts';
import { gateSentences, type LevelGate, maxLevelFor, stretchLevel } from './level-gate.ts';
import { pointPractice } from './point-practice.ts';
import { spanReadings, spanVariants } from './reading-check.ts';
import { questionKey, scanItemKey } from './scans.ts';
import { trustedSentences } from './sentence-trust.ts';
import { wordCard } from './unit-lesson.ts';

/** One card of a scanned lesson's practice, with the progress key it counts for. */
export type ScanCard =
  | { kind: 'card'; key: string; card: SessionCard }
  | { kind: 'question'; key: string; question: HandoutQuestion };

/** Cards in one practice, at most. */
export const SCAN_PRACTICE_CARDS = 12;
/** Pack sentences looked at per word. */
const WORD_SENTENCES = 30;
/** Drills per grammar point. */
const POINT_CARDS = 2;

export interface ScanPracticeOptions {
  now: number;
  /** The device has a Japanese voice, so listening exercises can be made (S4). */
  listening: boolean;
  size?: number;
}

interface Ctx {
  repos: Repos;
  options: ScanPracticeOptions;
  items: ReadonlyMap<string, Item>;
  levels: ReadonlyMap<string, KnowledgeLevel>;
  gate: LevelGate;
  introduced: ReadonlySet<string>;
  m: ExerciseMaterial;
}

/** Accepted answers per target, with attached endings, as in a daily session. */
function finish(card: SessionCard): SessionCard {
  const targets = card.targets.map((target) => {
    const variants = spanVariants(card.sentence, target.tokenIndex);
    const readings = [...spanReadings(card.sentence, target.tokenIndex), ...variants];
    return { ...target, readings, ...(variants.length > 0 ? { variants } : {}) };
  });
  return { ...card, targets };
}

/** A reading card on the word in a pack sentence that fits the gate, else on the word alone. */
async function readingCard(ctx: Ctx, word: Word): Promise<SessionCard | undefined> {
  const { repos, gate, levels } = ctx;
  const query = { maxLevel: maxLevelFor(gate, word.id), limit: WORD_SENTENCES };
  const found = (await repos.sentences.containingWord(word.id, query)).filter((s) => s.verified);
  const sentences = await trustedSentences(
    repos,
    await gateSentences(repos, gate, found, levels),
    levels,
  );
  const { now } = ctx.options;
  const fresh = [ctx.items.get(word.id) ?? newWordItem({ wordId: word.id, kind: 'scan', now })];
  const [card] = selectSession({ sentences, levels, due: [], fresh, size: 1, now });
  if (card) return finish(card);
  return wordCard(word, gate.level, (levels.get(word.id) ?? 0) >= 1);
}

async function wordCards(ctx: Ctx, ref: string): Promise<SessionCard[]> {
  const word = await ctx.repos.dictionary.word(ref);
  if (!word) return [];
  const reading = word.forms.some(hasKanji) ? await readingCard(ctx, word) : undefined;
  const meaning = meaningCard(ctx.m, word);
  return [reading, meaning].flatMap((card) => card ?? []);
}

/** A word written with the kanji: the lesson's own first, then the kanji as a word (雨 あめ). */
async function kanjiWord(ctx: Ctx, char: string, words: readonly Word[]) {
  const own = words.find((w) => w.forms.some((form) => form.includes(char)));
  if (own) return own;
  const alone = await ctx.repos.dictionary.wordsByText(char);
  return alone.find((w) => w.forms.includes(char));
}

async function kanjiCards(ctx: Ctx, char: string, words: readonly Word[]) {
  const word = await kanjiWord(ctx, char, words);
  const card = word && (await readingCard(ctx, word));
  if (card) return [card];
  const kanji = await ctx.repos.dictionary.kanji(char);
  const seed = ctx.m.seed;
  const drill = kanji && kanjiCardDrill({ kanji, known: [], direction: 'read', others: [], seed });
  return drill ? [drillCard(drill)] : [];
}

async function grammarCards(ctx: Ctx, ref: string): Promise<SessionCard[]> {
  const { now, listening } = ctx.options;
  const drills = (await pointPractice(ctx.repos, ref, { now, listening })).slice(0, POINT_CARDS);
  if (drills.length === 0 || ctx.introduced.has(ref) || ref.startsWith('particle-')) {
    return drills;
  }
  return [grammarIntroCard(ref), ...drills];
}

function cardsFor(ctx: Ctx, item: ScanItem, words: readonly Word[]): Promise<SessionCard[]> {
  const ref = item.ref ?? '';
  if (item.kind === 'kanji') return kanjiCards(ctx, ref, words);
  return item.kind === 'word' ? wordCards(ctx, ref) : grammarCards(ctx, ref);
}

/** Items with a ref (ours), those not practised yet first, then the least recently practised. */
function practiseOrder<T extends { key: string }>(list: readonly T[], lesson: ScannedLesson) {
  const at = (key: string) => lesson.practised[key] ?? 0;
  return [...list].sort((a, b) => at(a.key) - at(b.key));
}

async function itemCards(ctx: Ctx, lesson: ScannedLesson, size: number): Promise<ScanCard[]> {
  const ours = lesson.items.filter((item) => item.ref !== undefined);
  const refs = ours.filter((i) => i.kind === 'word').map((i) => i.ref ?? '');
  const words = (await ctx.repos.dictionary.words(refs)).flatMap((w) => w ?? []);
  const ordered = practiseOrder(
    ours.map((item) => ({ item, key: scanItemKey(item) })),
    lesson,
  );
  const out: ScanCard[] = [];
  for (const { item, key } of ordered) {
    if (out.length >= size) break;
    for (const card of await cardsFor(ctx, item, words)) out.push({ kind: 'card', key, card });
  }
  return out.slice(0, size);
}

/** The handout's questions, those not practised yet first. */
function questionCards(lesson: ScannedLesson): ScanCard[] {
  const cards = lesson.questions.map(
    (question): ScanCard => ({ kind: 'question', key: questionKey(question), question }),
  );
  return practiseOrder(cards, lesson);
}

/** Two item cards, then a handout question, in turn; then whatever is left of either. */
function interleave(items: readonly ScanCard[], questions: readonly ScanCard[]): ScanCard[] {
  const out: ScanCard[] = [];
  let q = 0;
  items.forEach((card, i) => {
    out.push(card);
    const question = questions[q];
    if (i % 2 === 1 && question) {
      out.push(question);
      q += 1;
    }
  });
  return [...out, ...questions.slice(q)];
}

/** Words the lesson teaches may be read one level harder, or at their own level (G3). */
async function gateFor(repos: Repos, lesson: ScannedLesson, level: LearnerLevel) {
  const ids = lesson.items.filter((i) => i.kind === 'word' && i.ref).map((i) => i.ref ?? '');
  const words = await repos.dictionary.words(ids);
  const taught = new Map<string, JlptLevel>();
  words.forEach((w) => {
    if (w) taught.set(w.id, Math.min(stretchLevel(level), w.jlpt ?? 1) as JlptLevel);
  });
  return { gate: { level, stretch: new Set(ids), taught }, words: words.flatMap((w) => w ?? []) };
}

async function contextFor(repos: Repos, lesson: ScannedLesson, options: ScanPracticeOptions) {
  const all = await repos.items.byKind('word');
  const levels = new Map(all.map((item) => [item.ref, item.level]));
  const level = learnerLevelOf(await repos.settings.get());
  const { gate, words } = await gateFor(repos, lesson, level);
  const seed = `scan|${lesson.id}|${Math.floor(options.now / DAY_MS)}`;
  const material = { repos, level, levels, seed, listening: options.listening };
  const ctx: Ctx = {
    repos,
    options,
    items: new Map(all.map((item) => [item.ref, item])),
    levels,
    gate,
    introduced: introducedGrammar(await repos.items.byKind('grammar')),
    m: await exerciseMaterial(material, words),
  };
  return ctx;
}

/**
 * The practice of one scanned lesson (see the module comment): at most `size` cards (12 by
 * default), item cards and handout questions in turn.
 */
export async function buildScanPractice(
  repos: Repos,
  lesson: ScannedLesson,
  options: ScanPracticeOptions,
): Promise<ScanCard[]> {
  const size = options.size ?? SCAN_PRACTICE_CARDS;
  const ctx = await contextFor(repos, lesson, options);
  const questions = questionCards(lesson);
  const share = questions.length === 0 ? size : Math.ceil((size * 2) / 3);
  const items = await itemCards(ctx, lesson, share);
  return interleave(items, questions).slice(0, size);
}
