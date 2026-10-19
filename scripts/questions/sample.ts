/**
 * Question quality harness: generates questions of every kind from the full committed packs
 * for N5, N4 and N3 learners and prints them for a human (or native-level) read-through.
 *
 *   bun scripts/questions/sample.ts [count per kind and level = 10] [seed = sample]
 *     [--kind=grammar-form,context-word] [--level=5,4]
 *
 * No AI calls: the generators are the app's own, the 読解 questions are the units' authored ones.
 */
import { seededOrder } from '../../src/domain/drills/seed.ts';
import { comprehensionSet } from '../../src/domain/questions/comprehension.ts';
import {
  contextWordMaker,
  grammarFormMaker,
  kanjiReadingMaker,
  type Maker,
  orthographyMaker,
  type QuestionContext,
  sentenceOrderMaker,
} from '../../src/domain/questions/sources.ts';
import type { Question } from '../../src/domain/questions/types.ts';
import { unitsAtLevel } from '../../src/domain/themes/index.ts';
import type { KnowledgeLevel, LearnerLevel, Sentence } from '../../src/domain/types.ts';
import { type FullPack, loadFullPack, packRepos } from './pack-repos.ts';

type Kind = Question['kind'];
const KINDS: readonly Kind[] = [
  'kanji-reading',
  'orthography',
  'context-word',
  'grammar-form',
  'sentence-order',
  'comprehension',
];
const LEVELS: readonly LearnerLevel[] = [5, 4, 3];
/** Sentences tried per kind and level before giving up. */
const TRIES = 6000;

function args() {
  const flags = new Map(
    process.argv
      .slice(2)
      .filter((a) => a.startsWith('--'))
      .map((a) => a.slice(2).split('=') as [string, string]),
  );
  const plain = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const list = (key: string) => flags.get(key)?.split(',');
  return {
    count: Number(plain[0] ?? 10),
    seed: plain[1] ?? 'sample',
    kinds: (list('kind') as Kind[] | undefined) ?? KINDS,
    levels: (list('level')?.map(Number) as LearnerLevel[] | undefined) ?? LEVELS,
  };
}

function makerFor(kind: Kind): Maker | undefined {
  if (kind === 'kanji-reading') return kanjiReadingMaker;
  if (kind === 'orthography') return orthographyMaker;
  if (kind === 'context-word') return contextWordMaker();
  if (kind === 'grammar-form') return grammarFormMaker;
  if (kind === 'sentence-order') return sentenceOrderMaker;
  return undefined;
}

/** A learner at `level`: every word of that level and the easier ones is known. */
function learner(pack: FullPack, level: LearnerLevel): Map<string, KnowledgeLevel> {
  return new Map(
    pack.words.flatMap((w) => (w.jlpt !== undefined && w.jlpt >= level ? [[w.id, 3]] : [])),
  );
}

function material(pack: FullPack, level: LearnerLevel, seed: string): Sentence[] {
  const fits = pack.sentences.filter(
    (s) => s.verified && s.translation && s.level !== undefined && s.level >= level,
  );
  return seededOrder(fits, (s) => s.id, seed);
}

function stemLine(q: Question): string {
  if (q.kind === 'sentence-order') {
    const slots = [0, 1, 2, 3].map((i) => (i === q.star ? '★' : '＿'));
    return `${q.before} ${slots.join(' ')} ${q.after}`;
  }
  if (q.kind === 'comprehension') return q.question;
  const mark = q.stem.mark === 'blank' ? `（${'＿'.repeat(3)}）` : `［${q.stem.target}］`;
  return `${q.stem.before}${mark}${q.stem.after}`;
}

function optionsLine(q: Question): string {
  return q.options.map((o, i) => `${i + 1} ${i === q.answer ? '*' : ''}${o.text}`).join('   ');
}

function extra(q: Question): string {
  if (q.kind === 'sentence-order')
    return `   order: ${q.order.map((i) => q.options[i]?.text).join(' | ')}`;
  if (q.kind === 'comprehension') return '';
  return q.stem.mark === 'blank'
    ? `   answer in place: ${q.stem.before}【${q.stem.target}】${q.stem.after}`
    : '';
}

let shown = 0;

function print(q: Question, level: LearnerLevel, translation?: string) {
  shown += 1;
  console.log(`#${shown} [${q.kind} · N${level}] ${q.id}${q.itemId ? ` · ${q.itemId}` : ''}`);
  console.log(`   ${stemLine(q)}`);
  if (translation) console.log(`   = ${translation}`);
  if (q.hint) console.log(`   hint before answering: ${q.hint}`);
  console.log(`   ${optionsLine(q)}`);
  const more = extra(q);
  if (more) console.log(more);
}

let texts: Set<string> | undefined;

async function sampleKind(
  pack: FullPack,
  kind: Kind,
  level: LearnerLevel,
  count: number,
  seed: string,
) {
  const maker = makerFor(kind);
  if (!maker) return;
  const repos = packRepos(pack);
  const sentences = material(pack, level, `${seed}|${kind}|${level}`);
  const ctx: QuestionContext = {
    repos,
    levels: learner(pack, level),
    sentences: sentences.slice(0, 400),
    avoid: new Set(),
    learnerLevel: level,
    grammar: [],
    known: (text) => {
      texts ??= new Set(pack.sentences.map((s) => s.text));
      return texts.has(text);
    },
    seed,
  };
  let made = 0;
  for (const sentence of sentences.slice(0, TRIES)) {
    if (made >= count) break;
    const q = await maker(ctx, sentence);
    if (!q) continue;
    made += 1;
    print(q, level, sentence.translation);
  }
  console.log(`-- ${kind} N${level}: ${made} of ${count}\n`);
}

function sampleComprehension(level: LearnerLevel, count: number, seed: string) {
  const units = seededOrder(unitsAtLevel(level), (u) => u.id, seed);
  let made = 0;
  for (const unit of units) {
    if (made >= count) break;
    const set = comprehensionSet({
      id: unit.id,
      sentences: unit.passage.sentences,
      questions: unit.questions,
    });
    if (!set) continue;
    console.log(
      `   passage ${set.id}: ${set.sentences.map((l, i) => `(${i + 1})${l.ja}`).join('')}`,
    );
    for (const q of set.questions.slice(0, count - made)) {
      made += 1;
      print(q, level, `evidence (${q.evidence + 1}) ${set.sentences[q.evidence]?.ja ?? ''}`);
    }
  }
  console.log(`-- comprehension N${level}: ${made} of ${count}\n`);
}

async function main() {
  const { count, seed, kinds, levels } = args();
  const pack = loadFullPack();
  for (const kind of kinds) {
    for (const level of levels) {
      if (kind === 'comprehension') sampleComprehension(level, count, seed);
      else await sampleKind(pack, kind, level, count, seed);
    }
  }
}

await main();
