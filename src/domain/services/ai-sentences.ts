/**
 * AI-written practice sentences (R6): only sentences that pass reading verification and the i+1
 * check against the learner's levels are kept, tokenized and stored as `source: 'ai'`.
 */
import type { Repos } from '../repos.ts';
import { isIPlusOne, KNOWN_LEVEL } from '../selector.ts';
import type { KnowledgeLevel, Sentence, Token } from '../types.ts';

/** One generated sentence, as the AI layer returns it. */
export interface DraftSentence {
  text: string;
  translation: string;
}

/** A reading the AI claimed, after verification. */
export interface DraftReading {
  surface: string;
  verified: boolean;
}

export interface AiSentenceDeps {
  repos: Repos;
  tokenize: (text: string) => Promise<Token[]>;
}

/** Words sent as "known" with a generation request; enough for variety, small for the prompt. */
const KNOWN_SAMPLE = 40;

/** FNV-1a, so the same sentence text always gets the same id and is stored once. */
function textHash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(36);
}

/** Stable id of an AI sentence. */
export function aiSentenceId(text: string): string {
  return `ai:${textHash(text)}`;
}

/** Written forms of words the learner reads well (level ≥ 3), most recently updated last. */
export async function knownWordSample(repos: Repos, limit = KNOWN_SAMPLE): Promise<string[]> {
  const items = (await repos.items.byKind('word')).filter((item) => item.level >= KNOWN_LEVEL);
  const words = await repos.dictionary.words(items.slice(-limit).map((item) => item.ref));
  return words.flatMap((word) => {
    const form = word?.forms[0] ?? word?.readings[0];
    return form ? [form] : [];
  });
}

/**
 * Word levels for the i+1 check. The practice targets count as unknown, so a sentence around a
 * word under review still has its one new item (the target) even when the word is at level 3.
 */
async function practiceLevels(
  repos: Repos,
  targetWordIds: readonly string[],
): Promise<Map<string, KnowledgeLevel>> {
  const items = await repos.items.byKind('word');
  const levels = new Map(items.map((item): [string, KnowledgeLevel] => [item.ref, item.level]));
  for (const id of targetWordIds) levels.set(id, 0);
  return levels;
}

/** False when any reading the AI claimed inside this sentence failed verification. */
function readingsHold(text: string, readings: readonly DraftReading[]): boolean {
  return !readings.some((r) => !r.verified && r.surface !== '' && text.includes(r.surface));
}

async function toSentence(deps: AiSentenceDeps, draft: DraftSentence): Promise<Sentence> {
  const tokens = await deps.tokenize(draft.text);
  return {
    id: aiSentenceId(draft.text),
    text: draft.text,
    translation: draft.translation,
    source: 'ai',
    tokens,
    wordIds: [...new Set(tokens.flatMap((token) => token.wordId ?? []))],
    verified: true,
  };
}

/**
 * Keeps the drafts whose readings all verified and that are i+1 for the learner (targets
 * counted as unknown), stores them and returns the ones stored. Already stored texts are skipped.
 */
export async function saveAiSentences(
  deps: AiSentenceDeps,
  drafts: readonly DraftSentence[],
  readings: readonly DraftReading[],
  targetWordIds: readonly string[],
): Promise<Sentence[]> {
  const levels = await practiceLevels(deps.repos, targetWordIds);
  const checked = drafts.filter((draft) => readingsHold(draft.text, readings));
  const sentences = await Promise.all(checked.map((draft) => toSentence(deps, draft)));
  const existing = await deps.repos.sentences.getMany(sentences.map((s) => s.id));
  const fresh = sentences.filter((s, i) => !existing[i] && isIPlusOne(s, levels));
  const unique = [...new Map(fresh.map((s) => [s.id, s])).values()];
  await deps.repos.sentences.putMany(unique);
  return unique;
}
