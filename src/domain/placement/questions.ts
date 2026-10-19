/**
 * Placement questions (A11) from the existing generators (J1, J2, J4) and the unit passages
 * (T6), at one JLPT level, whatever the learner already tracks: the question's sentence is
 * treated as known except for the one word being asked.
 */
import { seededOrder } from '../drills/seed.ts';
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { hasKanji } from '../kana.ts';
import { comprehensionSet } from '../questions/comprehension.ts';
import {
  grammarFormMaker,
  kanjiReadingMaker,
  type Maker,
  orthographyMaker,
  type QuestionContext,
} from '../questions/sources.ts';
import type { ChoiceQuestion, ComprehensionQuestion, PassageLine } from '../questions/types.ts';
import type { Repos } from '../repos.ts';
import { unitsAtLevel } from '../themes/units.ts';
import type { KnowledgeLevel, LearnerLevel, Sentence } from '../types.ts';
import type { PlacementKind } from './staircase.ts';

/** One placement question; a comprehension question carries its passage. */
export type PlacementQuestion =
  | { kind: Exclude<PlacementKind, 'comprehension'>; level: LearnerLevel; question: ChoiceQuestion }
  | {
      kind: 'comprehension';
      level: LearnerLevel;
      question: ComprehensionQuestion;
      passage: PassageLine[];
    };

/** Sentences looked at per question, and sentences loaded per level. */
const TRIES = 30;
const POOL = 200;

const MAKERS: Record<Exclude<PlacementKind, 'comprehension'>, Maker> = {
  'kanji-reading': kanjiReadingMaker,
  orthography: orthographyMaker,
  'grammar-form': grammarFormMaker,
};

/** Every word known, except the first kanji word of this level, which is the one asked. */
async function levelsFor(repos: Repos, sentence: Sentence, level: LearnerLevel, ask: boolean) {
  const levels = new Map<string, KnowledgeLevel>(sentence.wordIds.map((id) => [id, 3]));
  if (!ask) return levels;
  const words = await repos.dictionary.words(sentence.wordIds);
  const target = sentence.tokens.find((token) => {
    const word = words.find((w) => w?.id === token.wordId);
    return word?.jlpt === level && hasKanji(token.surface);
  });
  if (!target?.wordId) return undefined;
  levels.set(target.wordId, 1);
  return levels;
}

function contextFor(
  repos: Repos,
  level: LearnerLevel,
  seed: string,
  levels: Map<string, KnowledgeLevel>,
): QuestionContext {
  const grammar = GRAMMAR_CATALOGUE.filter((e) => e.level === level).map((e) => e.id);
  return { repos, levels, sentences: [], avoid: new Set(), learnerLevel: level, grammar, seed };
}

async function choiceQuestion(
  repos: Repos,
  kind: Exclude<PlacementKind, 'comprehension'>,
  level: LearnerLevel,
  seed: string,
  used: ReadonlySet<string>,
): Promise<PlacementQuestion | undefined> {
  const pool = (await repos.sentences.atLevel(level, POOL)).filter(
    (s) => s.verified && s.translation && !used.has(s.id),
  );
  for (const sentence of seededOrder(pool, (s) => s.id, `${seed}|${kind}`).slice(0, TRIES)) {
    const levels = await levelsFor(repos, sentence, level, kind !== 'grammar-form');
    const made = levels && (await MAKERS[kind](contextFor(repos, level, seed, levels), sentence));
    if (made && made.kind !== 'sentence-order' && made.kind !== 'comprehension') {
      return { kind, level, question: made };
    }
  }
  return undefined;
}

function comprehensionQuestion(level: LearnerLevel, seed: string, used: ReadonlySet<string>) {
  const units = seededOrder(unitsAtLevel(level), (u) => u.id, seed);
  for (const unit of units) {
    const set = comprehensionSet({
      id: unit.id,
      sentences: unit.passage.sentences,
      questions: unit.questions,
    });
    const question = set?.questions.find((q) => !used.has(q.id));
    if (set && question) {
      const found: PlacementQuestion = {
        kind: 'comprehension',
        level,
        question,
        passage: set.sentences,
      };
      return found;
    }
  }
  return undefined;
}

/** The id that keeps a question (and its sentence) from coming back. */
export function usedId(item: PlacementQuestion): string {
  return item.question.sentenceId ?? item.question.id;
}

/**
 * A question of `kind` at `level`, or of the next kinds in turn when that one has no material.
 * Undefined when nothing at this level can be asked any more.
 */
export async function placementQuestion(
  repos: Repos,
  request: {
    level: LearnerLevel;
    kinds: readonly PlacementKind[];
    seed: string;
    used: ReadonlySet<string>;
  },
): Promise<PlacementQuestion | undefined> {
  const { level, seed, used } = request;
  for (const kind of request.kinds) {
    const found =
      kind === 'comprehension'
        ? comprehensionQuestion(level, seed, used)
        : await choiceQuestion(repos, kind, level, seed, used);
    if (found) return found;
  }
  return undefined;
}
