/**
 * "Practise this point" on a grammar page (S5): a short set of that point's drills, shown on the
 * page itself. Pattern drills on words the learner has met (or the words of the units that teach
 * the point), a cloze with the sentence's meaning, and a sentence to build, from sentences that
 * use the point at or below the learner's level. A particle's page gets particle fills of that
 * particle instead. The link to a full focused session stays.
 */
import { lessonCloze, particleDrill } from '../drills/index.ts';
import { seededOrder } from '../drills/seed.ts';
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { FUNCTION_WORDS } from '../grammar/function-words.ts';
import type { GrammarEntry } from '../grammar/types.ts';
import type { Repos } from '../repos.ts';
import type { SessionCard } from '../session-types.ts';
import { UNITS } from '../themes/index.ts';
import type { Sentence } from '../types.ts';
import { drillCard } from './drills.ts';
import {
  buildCard,
  type ExerciseMaterial,
  exerciseMaterial,
  patternCard,
} from './exercise-material.ts';
import { pointSentences } from './grammar-session.ts';
import { DAY_MS } from './items.ts';
import { learnerLevelOf } from './learner-level.ts';
import { gateSentences, type LevelGate } from './level-gate.ts';
import { trustedSentences } from './sentence-trust.ts';

/** Drills in the set, at most. */
export const POINT_DRILLS = 4;

/** The words of the units that teach the point: cues the point is used with. */
async function unitWords(repos: Repos, grammarId: string) {
  const ids = UNITS.filter((u) => u.grammar.includes(grammarId)).map((u) => u.id);
  const packs = (await repos.units.all()).filter((pack) => ids.includes(pack.id));
  const words = await repos.dictionary.words(packs.flatMap((pack) => pack.wordIds));
  return words.flatMap((w) => w ?? []);
}

async function material(repos: Repos, grammarId: string, options: PointOptions) {
  const items = await repos.items.byKind('word');
  const levels = new Map(items.map((item) => [item.ref, item.level]));
  const level = learnerLevelOf(await repos.settings.get());
  const seed = `point|${grammarId}|${Math.floor(options.now / DAY_MS)}`;
  const ctx = { repos, level, levels, seed, listening: options.listening };
  const m = await exerciseMaterial(ctx, await unitWords(repos, grammarId));
  const gate = { level, stretch: new Set<string>() };
  return { m, sentences: await pointSentences(repos, grammarId, gate, levels) };
}

function clozeOn(m: ExerciseMaterial, entry: GrammarEntry, sentences: readonly Sentence[]) {
  const others = GRAMMAR_CATALOGUE.filter((e) => e.family === entry.family && e.level >= m.level);
  for (const sentence of sentences) {
    const drill = lessonCloze({ sentence, entry, others, seed: m.seed });
    if (drill) return drillCard(drill);
  }
  return undefined;
}

async function buildOn(m: ExerciseMaterial, grammarId: string, sentences: readonly Sentence[]) {
  for (const sentence of sentences) {
    const card = await buildCard(m, sentence, `grammar:${grammarId}`);
    if (card) return card;
  }
  return undefined;
}

export interface PointOptions {
  now: number;
  listening: boolean;
}

/** Easy sentences searched for a particle's drills. */
const PARTICLE_SENTENCES = 300;

/**
 * A particle's page (G5): particle fills of that particle (S4) in easy sentences the learner
 * can read, each in a different sentence (D96).
 */
async function particlePractice(repos: Repos, wordId: string, now: number) {
  const items = await repos.items.byKind('word');
  const levels = new Map(items.map((item) => [item.ref, item.level]));
  const gate: LevelGate = { level: learnerLevelOf(await repos.settings.get()), stretch: new Set() };
  const easy = (await repos.sentences.atLevel(5, PARTICLE_SENTENCES)).filter((s) => s.verified);
  const sentences = await trustedSentences(
    repos,
    await gateSentences(repos, gate, easy, levels),
    levels,
  );
  const seed = `point|${wordId}|${Math.floor(now / DAY_MS)}`;
  const cards: SessionCard[] = [];
  for (const sentence of seededOrder(sentences, (s) => s.id, seed)) {
    const drill = particleDrill({ sentences: [sentence], level: gate.level, seed, only: wordId });
    if (drill) cards.push(drillCard(drill));
    if (cards.length === POINT_DRILLS) break;
  }
  return cards;
}

/** The point's drills (see the module comment); empty for an unknown point. */
export async function pointPractice(
  repos: Repos,
  grammarId: string,
  options: PointOptions,
): Promise<SessionCard[]> {
  if (FUNCTION_WORDS.some((w) => w.id === grammarId)) {
    return particlePractice(repos, grammarId, options.now);
  }
  const entry = GRAMMAR_CATALOGUE.find((e) => e.id === grammarId);
  if (!entry) return [];
  const { m, sentences } = await material(repos, grammarId, options);
  const first = patternCard(m, grammarId);
  const cue = first?.drill?.kind === 'pattern' ? first.drill.cue : undefined;
  const second = cue && patternCard(m, grammarId, new Set([cue.wordId ?? cue.written]));
  const cloze = clozeOn(m, entry, sentences);
  const build = await buildOn(m, grammarId, sentences);
  const cards = [first, cloze, second, build].flatMap((card) => card ?? []);
  return cards.slice(0, POINT_DRILLS);
}
