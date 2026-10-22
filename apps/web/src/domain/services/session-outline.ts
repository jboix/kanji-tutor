/**
 * What is left in a session (R13): cards by kind, new words still to meet, grammar points still to
 * introduce, and a rough time. Rough per-card times, from the mock sessions: a reading card
 * about 30 s, an exercise 25 s, a passage 2 min, an introduction 20 s.
 */
import type { SessionCard } from '../session-types.ts';

export type OutlineKind = 'reading' | 'exercises' | 'passages';

export interface SessionOutline {
  /** One-based number of the current card. */
  current: number;
  total: number;
  /** Each kind of card: how many are done (before the current one) and how many in all. */
  kinds: Record<OutlineKind, { done: number; total: number }>;
  /** New words and grammar points the remaining cards (the current one included) introduce. */
  newWords: number;
  newGrammar: number;
  /** Rough minutes left, the current card included, at least 1 while cards remain. */
  minutes: number;
}

const SECONDS = { reading: 30, exercise: 25, passage: 120, intro: 20 } as const;

function kindOf(card: SessionCard): 'reading' | 'exercise' | 'passage' | 'intro' {
  if (card.grammarIntro) return 'intro';
  if (card.passage) return 'passage';
  if (card.question || card.drill) return 'exercise';
  return 'reading';
}

/** Rough seconds the cards take (R13), new-word introductions included; L6 caps sessions by it. */
export function sessionSeconds(cards: readonly SessionCard[]): number {
  const newWords = cards.filter((card) => card.reason === 'new').length;
  const each = cards.reduce((sum, card) => sum + SECONDS[kindOf(card)], 0);
  return each + newWords * SECONDS.intro;
}

const OUTLINE_KIND = { reading: 'reading', exercise: 'exercises', passage: 'passages' } as const;

function kinds(cards: readonly SessionCard[], index: number): SessionOutline['kinds'] {
  const result = {
    reading: { done: 0, total: 0 },
    exercises: { done: 0, total: 0 },
    passages: { done: 0, total: 0 },
  };
  cards.forEach((card, i) => {
    const kind = kindOf(card);
    if (kind === 'intro') return;
    const row = result[OUTLINE_KIND[kind]];
    row.total += 1;
    if (i < index) row.done += 1;
  });
  return result;
}

export function sessionOutline(cards: readonly SessionCard[], index: number): SessionOutline {
  const ahead = cards.slice(index);
  return {
    current: Math.min(index + 1, cards.length),
    total: cards.length,
    kinds: kinds(cards, index),
    newWords: ahead.filter((card) => card.reason === 'new').length,
    newGrammar: ahead.filter((card) => card.grammarIntro).length,
    minutes: ahead.length === 0 ? 0 : Math.max(1, Math.round(sessionSeconds(ahead) / 60)),
  };
}
