/**
 * Accepting a corrected Use it sentence (A6): it joins the learner's sentences and counts as
 * the grammar point being used.
 */
import { isoWeek, itemId } from '../ids.ts';
import type { Repos } from '../repos.ts';
import { newCard } from '../scheduler.ts';
import type { GrammarPoint, Item, KnowledgeLevel, Sentence, Token } from '../types.ts';

/** The parts of an AI correction this service needs (structurally an `ai` `Correction`). */
export interface AcceptedCorrection {
  corrected: string;
  marks: readonly { severity: 'error' | 'style' }[];
  usesTarget: boolean;
  readings: readonly { verified: boolean }[];
}

export interface AcceptCompositionInput {
  grammar: GrammarPoint;
  /** What the learner wrote, before corrections. */
  original: string;
  correction: AcceptedCorrection;
  now: number;
  /** The tokenizer, passed in by the feature. Without it the sentence stays unverified. */
  lang?: { tokenize(text: string): Promise<Token[]> };
}

export interface AcceptCompositionResult {
  sentence: Sentence;
  /** The grammar item after the update. */
  item: Item;
}

/**
 * Grammar level after an accepted sentence (K2 mapped to output): used without error marks is
 * 4, as a word read in a new sentence; used with errors the red pen fixed is 3. Never lowers.
 */
export function usedLevel(current: KnowledgeLevel, hadErrors: boolean): KnowledgeLevel {
  const reached: KnowledgeLevel = hadErrors ? 3 : 4;
  return current > reached ? current : reached;
}

async function tokensOf(input: AcceptCompositionInput, text: string): Promise<Token[]> {
  if (!input.lang) return [];
  try {
    return await input.lang.tokenize(text);
  } catch {
    return [];
  }
}

function sentenceId(now: number, text: string): string {
  let hash = 0;
  for (const char of text) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) >>> 0;
  return `compose-${now.toString(36)}-${hash.toString(36)}`;
}

async function buildSentence(input: AcceptCompositionInput): Promise<Sentence> {
  const { correction, grammar, now } = input;
  const text = correction.corrected.trim() || input.original.trim();
  const tokens = await tokensOf(input, text);
  const readingsOk = correction.readings.every((reading) => reading.verified);
  return {
    id: sentenceId(now, text),
    text,
    source: 'compose',
    sourceRef: itemId('grammar', grammar.id),
    tokens,
    wordIds: [...new Set(tokens.flatMap((t) => (t.wordId ? [t.wordId] : [])))],
    grammarIds: correction.usesTarget ? [grammar.id] : [],
    verified: tokens.length > 0 && readingsOk,
  };
}

function updatedItem(existing: Item | undefined, input: AcceptCompositionInput): Item {
  const { grammar, correction, now } = input;
  const item: Item = existing ?? {
    id: itemId('grammar', grammar.id),
    kind: 'grammar',
    ref: grammar.id,
    level: 1,
    source: { kind: 'compose', week: isoWeek(new Date(now)), addedAt: now },
    updatedAt: now,
  };
  const hadErrors = correction.marks.some((mark) => mark.severity === 'error');
  const level = correction.usesTarget ? usedLevel(item.level, hadErrors) : item.level;
  return { ...item, level, card: item.card ?? newCard(now), updatedAt: now };
}

/**
 * Saves the corrected sentence as a `compose` sentence exercising the grammar point, and marks
 * the point as used (A6): level 4 without error marks, 3 with them (see {@link usedLevel}), an
 * FSRS card if it had none, and the sentence among its examples. The sentence is verified only
 * when it tokenized and every AI reading passed verification; unverified sentences are kept
 * but never shown in sessions. A correction that does not use the target saves the sentence
 * without the grammar id and leaves the level alone.
 */
export async function acceptComposition(
  repos: Repos,
  input: AcceptCompositionInput,
): Promise<AcceptCompositionResult> {
  const sentence = await buildSentence(input);
  await repos.sentences.put(sentence);
  const existing = await repos.items.get(itemId('grammar', input.grammar.id));
  const item = updatedItem(existing, input);
  await repos.items.put(item);
  if (input.correction.usesTarget) {
    const examples = [...input.grammar.exampleSentenceIds, sentence.id];
    await repos.grammar.put({ ...input.grammar, exampleSentenceIds: examples });
  }
  return { sentence, item };
}
