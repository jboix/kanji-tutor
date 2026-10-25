/**
 * A session focused on one grammar point (`/read?grammar=…`, the grammar page's "Practise
 * this"): reading cards in sentences that use it, at or below the learner's level (G3), then
 * 文法形式の判断 and 文の組み立て questions on its sentences, and last a line to complete in one of
 * its dialogues. A point not introduced yet gets its introduction card first (G4).
 */
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { hasKanji } from '../kana.ts';
import { makeQuestions } from '../questions/mix.ts';
import type { Repos } from '../repos.ts';
import { selectSession } from '../selector.ts';
import type { SessionCard } from '../session-types.ts';
import type { Item, Sentence } from '../types.ts';
import { dialogueCard } from './dialogue-card.ts';
import { grammarIntroCard, introducedGrammar } from './grammar-intro.ts';
import { DAY_MS, newWordItem } from './items.ts';
import { learnerLevelOf } from './learner-level.ts';
import { gateSentences, type LevelGate } from './level-gate.ts';
import { trustedSentences } from './sentence-trust.ts';
import { mixCards } from './session-mix.ts';

/** Reading cards in a grammar focus session. */
export const GRAMMAR_SESSION_SIZE = 6;
/** Sentences of the point fetched, easiest first. */
const GRAMMAR_SENTENCES = 60;

/** The kanji words of the sentences: tracked ones as they are, new ones as fresh items. */
function queueOf(sentences: readonly Sentence[], items: ReadonlyMap<string, Item>, now: number) {
  const ids = [
    ...new Set(
      sentences.flatMap((s) => s.tokens.filter((t) => hasKanji(t.surface)).map((t) => t.wordId)),
    ),
  ].flatMap((id) => id ?? []);
  const due = ids.flatMap((id) => items.get(id) ?? []);
  const fresh = ids
    .filter((id) => !items.has(id))
    .map((wordId) => newWordItem({ wordId, kind: 'session', now }));
  return { due, fresh };
}

/** Verified sentences that use the point, at or below the gate's level, with checked readings. */
export async function pointSentences(
  repos: Repos,
  grammarId: string,
  gate: LevelGate,
  levels: Map<string, Item['level']>,
) {
  const found = await repos.sentences.withGrammar(grammarId, {
    maxLevel: gate.level,
    limit: GRAMMAR_SENTENCES,
  });
  const verified = found.filter((s) => s.verified);
  return trustedSentences(repos, await gateSentences(repos, gate, verified, levels), levels);
}

/** The focus session (see the module comment); empty for an unknown point. */
export async function buildGrammarSession(
  repos: Repos,
  grammarId: string,
  now: number,
  finish: (card: SessionCard) => SessionCard,
): Promise<SessionCard[]> {
  if (!GRAMMAR_CATALOGUE.some((e) => e.id === grammarId)) return [];
  const all = await repos.items.byKind('word');
  const items = new Map(all.map((item) => [item.ref, item]));
  const levels = new Map(all.map((item) => [item.ref, item.level]));
  const gate: LevelGate = { level: learnerLevelOf(await repos.settings.get()), stretch: new Set() };
  const sentences = await pointSentences(repos, grammarId, gate, levels);
  const queue = queueOf(sentences, items, now);
  const size = GRAMMAR_SESSION_SIZE;
  const cards = selectSession({ sentences, levels, ...queue, size, now }).map(finish);
  const skip = new Set(GRAMMAR_CATALOGUE.map((e) => e.id).filter((id) => id !== grammarId));
  const options = { now, every: 0, levels, sentences, recent: [], gate, prefer: [grammarId] };
  const kinds = ['grammar-form', 'sentence-order'] as const;
  const questions = await makeQuestions(
    repos,
    cards,
    { ...options, skipGrammar: skip, only: true, kinds },
    size,
  );
  const mixed = cards.length > 0 ? mixCards(cards, questions) : questions;
  return withIntroAndDialogue(repos, grammarId, mixed, now);
}

/**
 * The session's cards, then a line to complete in one of the point's dialogues, when it has
 * some; a point not introduced yet gets its introduction first.
 */
async function withIntroAndDialogue(
  repos: Repos,
  grammarId: string,
  mixed: SessionCard[],
  now: number,
): Promise<SessionCard[]> {
  const dialogue = await dialogueCard(
    grammarId,
    `grammar|${grammarId}|${Math.floor(now / DAY_MS)}`,
  );
  const cards = dialogue ? [...mixed, dialogue] : mixed;
  const known = introducedGrammar(await repos.items.byKind('grammar')).has(grammarId);
  return known || cards.length === 0 ? cards : [grammarIntroCard(grammarId), ...cards];
}
