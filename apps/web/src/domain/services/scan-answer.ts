/**
 * Answers in a scanned lesson's practice. Each one updates the same knowledge levels and FSRS
 * cards as an answer anywhere else, so what is learned from a scan comes back in the daily
 * reviews (one card per item); an item first met here is tracked with a `scan` source, which the
 * daily sessions never introduce as new. A right answer also counts in the lesson's progress.
 */
import type { Drill } from '../drills/types.ts';
import { gradeReading, skipGrade } from '../grading.ts';
import { isoWeek, itemId, parseItemId } from '../ids.ts';
import { toKanaFold } from '../kana.ts';
import type { Repos } from '../repos.ts';
import type { HandoutQuestion } from '../scan-types.ts';
import { newCard, reviewCard } from '../scheduler.ts';
import type { SessionCard, Target } from '../session-types.ts';
import type { AnswerMode, Grade, Item, Review, Source } from '../types.ts';
import { recordAnswer, saveGradedReading } from './answer.ts';
import { recordDrillAnswer } from './drill-answer.ts';
import { newWordItem } from './items.ts';
import { withPractised } from './scan-progress.ts';
import { questionKey } from './scans.ts';

/** What every practice answer carries. */
export interface ScanAnswerBase {
  lessonId: string;
  /** The card's progress key (`ScanCard.key`). */
  key: string;
  durationMs: number;
  now: number;
  /** "I don't know" (L4): the answer is shown and graded as a skip. */
  skipped?: boolean;
}

function scanSource(lessonId: string, now: number): Source {
  return { kind: 'scan', scanId: lessonId, week: isoWeek(new Date(now)), addedAt: now };
}

/**
 * The word or grammar item a key names, created when missing with a `scan` source: a word
 * unseen, a grammar point seen (as after its introduction), each with a fresh FSRS card.
 */
export async function ensureScanItem(repos: Repos, key: string, lessonId: string, now: number) {
  const { kind, ref } = parseItemId(key as Item['id']);
  if (kind !== 'word' && kind !== 'grammar') return;
  const id = itemId(kind, ref);
  if (await repos.items.get(id)) return;
  const source = scanSource(lessonId, now);
  const item: Item =
    kind === 'word'
      ? { ...newWordItem({ wordId: ref, kind: 'scan', now }), source }
      : { id, kind, ref, level: 1, card: newCard(now), source, updatedAt: now };
  await repos.items.put(item);
}

/** Counts the keys as practised in the lesson. */
export async function markScanPractised(
  repos: Repos,
  lessonId: string,
  keys: readonly string[],
  now: number,
) {
  const lesson = await repos.scans.get(lessonId);
  if (lesson && keys.length > 0) await repos.scans.put(withPractised(lesson, keys, now));
}

async function counted(repos: Repos, input: ScanAnswerBase, grade: Grade): Promise<Grade> {
  if (grade.verdict === 'correct')
    await markScanPractised(repos, input.lessonId, [input.key], input.now);
  return grade;
}

/** A reading typed or said on a card's target (see `recordAnswer`). */
export async function recordScanReading(
  repos: Repos,
  input: ScanAnswerBase & { card: SessionCard; target: Target; answer: string; mode: AnswerMode },
): Promise<Grade> {
  await ensureScanItem(repos, `word:${input.target.wordId}`, input.lessonId, input.now);
  const grade = await recordAnswer(repos, { ...input, skipped: input.skipped === true });
  return counted(repos, input, grade);
}

/** The item a drill reviews: its own, else the card's key. */
const drillItem = (drill: Drill, key: string) => ('itemId' in drill && drill.itemId) || key;

/** A drill's answer (see `recordDrillAnswer`); a grammar drill reviews the point's card. */
export async function recordScanDrill(
  repos: Repos,
  input: ScanAnswerBase & { drill: Drill; step: number; answer: string },
): Promise<Grade> {
  await ensureScanItem(repos, drillItem(input.drill, input.key), input.lessonId, input.now);
  const grade = await recordDrillAnswer(repos, input);
  return counted(repos, input, grade);
}

/** "Got it" on a grammar introduction: the point is tracked, seen, from this lesson. */
export function recordScanIntro(repos: Repos, input: Omit<ScanAnswerBase, 'durationMs'>) {
  return ensureScanItem(repos, input.key, input.lessonId, input.now);
}

/** Spacing, punctuation, blanks and the kana script folded away. */
function folded(text: string): string {
  return toKanaFold(text).replace(/[\s。、．.,，！!？?「」『』（）()＿_〜~・]/gu, '');
}

/**
 * Grades an answer to a handout question against the tutor's: a reading by the reading rules
 * (near-misses included), anything else as the same text once folded (see `folded`).
 */
export function gradeHandout(question: HandoutQuestion, answer: string, skipped = false): Grade {
  if (skipped) return skipGrade([question.answer]);
  if (question.type === 'reading') return gradeReading([question.answer], answer);
  const right = folded(answer) !== '' && folded(answer) === folded(question.answer);
  return { verdict: right ? 'correct' : 'wrong', expected: question.answer, given: answer.trim() };
}

function reviewOf(id: Item['id'], grade: Grade, input: ScanAnswerBase): Review {
  const review: Review = {
    at: input.now,
    itemId: id,
    answer: grade.given,
    expected: grade.expected,
    verdict: grade.verdict,
    durationMs: input.durationMs,
    mode: 'drill',
  };
  if (grade.skipped) review.skipped = true;
  return review;
}

/** A grammar point the question practises: its review, and its FSRS card (Good or Again). */
async function reviewPoint(repos: Repos, id: Item['id'], grade: Grade, input: ScanAnswerBase) {
  await ensureScanItem(repos, id, input.lessonId, input.now);
  const item = await repos.items.get(id);
  if (!item?.card) return;
  const rating = grade.verdict === 'correct' ? 3 : 1;
  await repos.items.put({
    ...item,
    card: reviewCard(item.card, rating, input.now),
    updatedAt: input.now,
  });
  await repos.reviews.add(reviewOf(id, grade, input));
}

/** A reading question on a word of ours, with a verified answer: a reading like any other. */
async function readWord(repos: Repos, wordId: string, grade: Grade, input: ScanAnswerBase) {
  await ensureScanItem(repos, `word:${wordId}`, input.lessonId, input.now);
  const reading = { wordId, result: grade, answer: grade.given, mode: 'typed' as const };
  await saveGradedReading(repos, { ...reading, durationMs: input.durationMs, now: input.now });
}

/** Applies a handout answer to the items the question practises. */
async function applyToItems(repos: Repos, q: HandoutQuestion, grade: Grade, input: ScanAnswerBase) {
  for (const key of q.practises) {
    const { kind, ref } = parseItemId(key as Item['id']);
    if (kind === 'grammar') await reviewPoint(repos, itemId('grammar', ref), grade, input);
    const reads = q.type === 'reading' && q.answerVerified && q.target !== undefined;
    if (kind === 'word' && reads) await readWord(repos, ref, grade, input);
  }
}

/**
 * Grades and records an answer to a handout question: the grammar points it practises are
 * reviewed, a verified reading question reads its word, and a right answer counts the question
 * and the items it practises in the lesson's progress.
 */
export async function recordScanQuestion(
  repos: Repos,
  input: Omit<ScanAnswerBase, 'key'> & { question: HandoutQuestion; answer: string },
): Promise<Grade> {
  const { question } = input;
  const base = { ...input, key: questionKey(question) };
  const grade = gradeHandout(question, input.answer, input.skipped === true);
  await applyToItems(repos, question, grade, base);
  if (grade.verdict === 'correct') {
    await markScanPractised(repos, input.lessonId, [base.key, ...question.practises], input.now);
  }
  return grade;
}
