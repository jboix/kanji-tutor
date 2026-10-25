/**
 * Start → Kanji: a round of kanji cards over the kanji the learner reads (those with a known
 * reading, K3). Kanji missed lately come first, then the least known, in a daily seeded order;
 * cards take turns between reading a kanji and writing it.
 */
import { kanjiCardDrill } from '../drills/index.ts';
import { seededOrder } from '../drills/seed.ts';
import type { Repos } from '../repos.ts';
import type { SessionCard } from '../session-types.ts';
import type { Kanji, KanjiReading, SessionMinutes } from '../types.ts';
import { drillCard } from './drills.ts';
import { DAY_MS } from './items.ts';
import { DEFAULT_SESSION_MINUTES } from './session-length.ts';

/** Cards in a round, by the session length the learner chose. */
export const KANJI_CARDS: Readonly<Record<SessionMinutes, number>> = { 5: 10, 10: 20, 15: 30 };

/** How far back a missed kanji counts as missed lately. */
const MISSED_MS = 14 * DAY_MS;

interface Known {
  char: string;
  /** Its known readings, as stored (セイ, い.きる). */
  readings: string[];
  /** Its least known reading's level. */
  level: number;
}

function knownKanji(rows: readonly KanjiReading[]): Known[] {
  const byChar = new Map<string, Known>();
  for (const row of rows.filter((r) => r.level > 0)) {
    const known = byChar.get(row.kanji) ?? { char: row.kanji, readings: [], level: row.level };
    known.readings.push(row.reading);
    known.level = Math.min(known.level, row.level);
    byChar.set(row.kanji, known);
  }
  return [...byChar.values()];
}

/** Kanji whose reading or card was answered wrong lately. */
async function missedLately(repos: Repos, now: number): Promise<Set<string>> {
  const reviews = await repos.reviews.since(now - MISSED_MS);
  const chars = reviews
    .filter((r) => r.verdict !== 'correct')
    .flatMap((r) => (/^kanji(Reading)?:/u.test(r.itemId) ? [r.itemId.split(':')[1] ?? ''] : []));
  return new Set(chars);
}

/** The kanji to card, most needed first: missed lately, then the least known. */
function ranked(known: readonly Known[], missed: ReadonlySet<string>, seed: string): Known[] {
  const need = (k: Known) => (missed.has(k.char) ? 0 : k.level);
  return seededOrder(known, (k) => k.char, seed).sort((a, b) => need(a) - need(b));
}

async function cardsSize(repos: Repos): Promise<number> {
  const minutes = (await repos.settings.get()).sessionMinutes ?? DEFAULT_SESSION_MINUTES;
  return KANJI_CARDS[minutes];
}

/** A round of kanji cards (see the module comment); none before the learner reads a kanji. */
export async function kanjiCardSession(repos: Repos, now: number): Promise<SessionCard[]> {
  const seed = `kanji-cards|${Math.floor(now / DAY_MS)}`;
  const known = ranked(
    knownKanji(await repos.kanjiReadings.all()),
    await missedLately(repos, now),
    seed,
  );
  const entries = (await repos.dictionary.kanjiMany(known.map((k) => k.char))).flatMap(
    (k) => k ?? [],
  );
  const byChar = new Map(entries.map((k): [string, Kanji] => [k.char, k]));
  const cards: SessionCard[] = [];
  for (const k of known.slice(0, await cardsSize(repos))) {
    const kanji = byChar.get(k.char);
    const direction = cards.length % 2 === 0 ? 'read' : 'write';
    const input = { known: k.readings, direction, others: entries, seed } as const;
    const drill = kanji && kanjiCardDrill({ ...input, kanji });
    if (drill) cards.push(drillCard(drill));
  }
  return cards;
}
