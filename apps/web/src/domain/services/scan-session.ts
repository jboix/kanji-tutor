/**
 * A scanned lesson's practice as a reading session (`/read?scan=…`): its cards as session cards
 * marked with the lesson and the progress key each counts for, the items a card practises
 * tracked from the lesson before it is answered, and a right answer counted in its progress.
 */
import type { Repos } from '../repos.ts';
import type { HandoutQuestion } from '../scan-types.ts';
import type { SessionCard } from '../session-types.ts';
import type { Sentence } from '../types.ts';
import { ensureScanItem, markScanPractised } from './scan-answer.ts';
import { buildScanPractice, type ScanCard, type ScanPracticeOptions } from './scan-practice.ts';

/** A handout question as a session card: nothing to read, the question itself to answer. */
function handoutCard(lessonId: string, key: string, question: HandoutQuestion): SessionCard {
  const sentence: Sentence = {
    id: `handout:${lessonId}:${question.id}`,
    text: question.stem,
    source: 'capture',
    tokens: [],
    wordIds: [],
    verified: true,
  };
  return { sentence, targets: [], reason: 'drill', handout: question, scan: { lessonId, key } };
}

function sessionCard(lessonId: string, card: ScanCard): SessionCard {
  if (card.kind === 'question') return handoutCard(lessonId, card.key, card.question);
  return { ...card.card, scan: { lessonId, key: card.key } };
}

/** The practice of lesson `id` as session cards; none when the lesson is gone. */
export async function scanSessionCards(
  repos: Repos,
  id: string,
  options: ScanPracticeOptions,
): Promise<SessionCard[]> {
  const lesson = await repos.scans.get(id);
  if (!lesson) return [];
  const cards = await buildScanPractice(repos, lesson, options);
  return cards.map((card) => sessionCard(id, card));
}

/** The item keys a card practises: its own, its drill's, and its reading targets' words. */
function keysOf(card: SessionCard): string[] {
  const drill = card.drill && 'itemId' in card.drill ? card.drill.itemId : undefined;
  const targets = card.targets.map((target) => target.itemId);
  return [card.scan?.key, drill, ...targets].flatMap((key) => key ?? []);
}

/**
 * Tracks the words and grammar points a scan card practises, from the lesson, before it is
 * answered: an answer then reviews their cards, and the daily sessions never take them as new.
 */
export async function prepareScanCard(repos: Repos, card: SessionCard, now: number) {
  if (!card.scan) return;
  for (const key of new Set(keysOf(card)))
    await ensureScanItem(repos, key, card.scan.lessonId, now);
}

/** Counts a scan card answered right in its lesson's progress. */
export async function countScanCard(repos: Repos, card: SessionCard, right: boolean, now: number) {
  if (card.scan && right) await markScanPractised(repos, card.scan.lessonId, [card.scan.key], now);
}
