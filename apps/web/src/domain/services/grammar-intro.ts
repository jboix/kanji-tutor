/**
 * Grammar introductions (G4): a grammar point of the learner's level is introduced with a
 * card (meaning, formation, two examples) before its first exercise in a session, then joins
 * FSRS. Points easier than the learner's level count as known, like the JLPT lists they start
 * past. New points come in unit order (the current unit, then later units of the level), then
 * in catalogue order.
 */
import type { Drill } from '../drills/types.ts';
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { isoWeek, itemId } from '../ids.ts';
import type { Repos } from '../repos.ts';
import { newCard } from '../scheduler.ts';
import type { SessionCard } from '../session-types.ts';
import { UNITS } from '../themes/index.ts';
import type { Item, LearnerLevel, Sentence } from '../types.ts';

/** New grammar points brought into one session, at most. */
export const NEW_GRAMMAR_PER_SESSION = 2;

const levelOf = new Map(GRAMMAR_CATALOGUE.map((entry) => [entry.id, entry.level]));

/** Grammar ids the learner has an item for: introduced before. */
export function introducedGrammar(items: readonly Item[]): Set<string> {
  return new Set(items.filter((item) => item.kind === 'grammar').map((item) => item.ref));
}

/** True when a point needs no introduction: introduced, or easier than the learner's level. */
function settled(id: string, level: LearnerLevel, introduced: ReadonlySet<string>): boolean {
  return introduced.has(id) || (levelOf.get(id) ?? 5) > level;
}

/**
 * The next new grammar points (see the module comment): the unit's first, then later units' of
 * the learner's level, then the catalogue's, never harder than the level.
 */
export function grammarQueue(input: {
  level: LearnerLevel;
  unitGrammar: readonly string[];
  introduced: ReadonlySet<string>;
  count?: number;
}): string[] {
  const { level, introduced } = input;
  const ordered = [
    ...input.unitGrammar,
    ...UNITS.filter((u) => u.level === level).flatMap((u) => u.grammar),
    ...GRAMMAR_CATALOGUE.filter((e) => e.level === level).map((e) => e.id),
  ];
  const fresh = [...new Set(ordered)].filter(
    (id) => levelOf.get(id) === level && !settled(id, level, introduced),
  );
  return fresh.slice(0, input.count ?? NEW_GRAMMAR_PER_SESSION);
}

/** Catalogue points a question may not blank yet: of the level, not introduced, not new now. */
export function unintroducedGrammar(
  level: LearnerLevel,
  introduced: ReadonlySet<string>,
  fresh: readonly string[],
): Set<string> {
  const ids = GRAMMAR_CATALOGUE.map((e) => e.id);
  return new Set(ids.filter((id) => !settled(id, level, introduced) && !fresh.includes(id)));
}

/** A grammar introduction card (G4): no targets, nothing to answer. */
export function grammarIntroCard(grammarId: string): SessionCard {
  const sentence: Sentence = {
    id: `grammar-intro:${grammarId}`,
    text: '',
    source: 'tatoeba',
    tokens: [],
    wordIds: [],
    verified: true,
  };
  return { sentence, targets: [], reason: 'drill', grammarIntro: grammarId };
}

/**
 * A cloze, pattern or dialogue drill asks the point; a particle fill, a sentence to build or one
 * to hear uses it when its sentence does (S4).
 */
function drillUses(drill: Drill, grammarId: string): boolean {
  if ('grammarId' in drill) return drill.grammarId === grammarId;
  if (drill.kind === 'particle' || drill.kind === 'build' || drill.kind === 'listening') {
    return drill.sentence.grammarIds?.includes(grammarId) ?? false;
  }
  return false;
}

/** True when the card asks or uses this grammar point. */
export function exercisesGrammar(card: SessionCard, grammarId: string): boolean {
  if (card.question) return card.question.itemId === itemId('grammar', grammarId);
  if (card.drill) return drillUses(card.drill, grammarId);
  if (card.passage || card.grammarIntro) return false;
  return card.sentence.grammarIds?.includes(grammarId) ?? false;
}

/**
 * Puts each new point's introduction right before the first card that exercises it (L8), even
 * when that card opens the session. With explanations skipped (L7), that card carries the point
 * in `newGrammar` instead, for its "New grammar" chip. A point no card exercises is not
 * introduced this time.
 */
export function withGrammarIntros(
  cards: readonly SessionCard[],
  fresh: readonly string[],
  explainFirst = true,
): SessionCard[] {
  const out = [...cards];
  for (const id of fresh) {
    const at = out.findIndex((card) => exercisesGrammar(card, id));
    const card = out[at];
    if (!card) continue;
    if (explainFirst) out.splice(at, 0, grammarIntroCard(id));
    else out[at] = { ...card, newGrammar: [...(card.newGrammar ?? []), id] };
  }
  return out;
}

/**
 * Records a grammar introduction (G4): the point gets an item (level 1, seen) with a fresh FSRS
 * card, so it is reviewed through cloze from then on. An existing item is left as it is.
 */
export async function introduceGrammar(repos: Repos, grammarId: string, now: number) {
  const id = itemId('grammar', grammarId);
  if (await repos.items.get(id)) return;
  const item: Item = {
    id,
    kind: 'grammar',
    ref: grammarId,
    level: 1,
    card: newCard(now),
    source: { kind: 'session', week: isoWeek(new Date(now)), addedAt: now },
    updatedAt: now,
  };
  await repos.items.put(item);
}
