/**
 * Captures from class (C3, C5, K5, R6): a photographed or pasted page kept with its text, its
 * lines saved as capture sentences, and the words and grammar points the learner ticks added as
 * items tagged with the capture, the lesson and the school week.
 */
import { isoWeek, itemId } from '../ids.ts';
import type { Repos } from '../repos.ts';
import { newCard } from '../scheduler.ts';
import { isIPlusOne, unknownTokens } from '../selector.ts';
import type { Capture, GrammarPoint, Item, ItemId, Sentence, Source, Token } from '../types.ts';
import { newWordItem } from './items.ts';
import { prioritised } from './own-sentences.ts';

/** A capture before it is stored: its lines already tokenized. */
export interface CaptureDraft {
  id: string;
  createdAt: number;
  photo?: Blob;
  lines: { text: string; tokens: Token[] }[];
  lesson?: string;
}

/** A grammar point the learner ticked, e.g. { pattern: "〜わけではない" }. */
export interface GrammarDraft {
  pattern: string;
  meaning?: string;
}

export interface AddCaptureInput {
  capture: CaptureDraft;
  /** JMdict ids of the ticked words. */
  words: readonly string[];
  grammar: readonly GrammarDraft[];
  /** Lesson tag for the new items, e.g. "Tobira 第4課"; none when empty. */
  lesson?: string;
  now: number;
}

export interface AddCaptureResult {
  capture: Capture;
  /** Items created by this call; empty when everything was already added. */
  created: ItemId[];
}

/** Id of a captured line's sentence: stable, so saving twice overwrites. */
export function captureSentenceId(captureId: string, line: number): string {
  return `capture:${captureId}:${line}`;
}

/** Grammar point id from a pattern: the pattern without its leading 〜. */
export function grammarIdOf(pattern: string): string {
  return pattern.trim().replace(/^[〜~]/u, '');
}

function sentenceOf(
  draft: CaptureDraft,
  line: CaptureDraft['lines'][number],
  i: number,
  fromPhoto: boolean,
) {
  const wordIds = [...new Set(line.tokens.flatMap((t) => (t.wordId ? [t.wordId] : [])))];
  const sentence: Sentence = {
    id: captureSentenceId(draft.id, i),
    text: line.text,
    source: 'capture',
    sourceRef: draft.id,
    tokens: line.tokens,
    wordIds,
    // The learner's own page, not model output: OCR text they keep is treated as human text.
    verified: true,
  };
  // Read from a photo by the tutor: the line keeps that mark wherever it shows (A18).
  if (fromPhoto) sentence.aiRead = true;
  return sentence;
}

/** Keeps the lines' grammar ids that a sentence already had. */
async function withGrammar(repos: Repos, sentences: Sentence[], grammar: readonly string[]) {
  const stored = await repos.sentences.getMany(sentences.map((s) => s.id));
  return sentences.map((sentence, i) => {
    const pattern = grammar.filter((id) => sentence.text.includes(id));
    const ids = [...new Set([...(stored[i]?.grammarIds ?? []), ...pattern])];
    return ids.length > 0 ? { ...sentence, grammarIds: ids } : sentence;
  });
}

/**
 * Stores a capture with its photo and text, and its lines as verified capture sentences (C5,
 * R6). Idempotent: the capture keeps the items already added from it.
 */
export async function saveCapture(
  repos: Repos,
  draft: CaptureDraft,
  grammarIds: readonly string[] = [],
): Promise<Capture> {
  const existing = await repos.captures.get(draft.id);
  const photo = draft.photo ?? existing?.photo;
  const plain = draft.lines.map((line, i) => sentenceOf(draft, line, i, photo !== undefined));
  const sentences = await withGrammar(repos, plain, grammarIds);
  await repos.sentences.putMany(sentences);
  const capture: Capture = {
    id: draft.id,
    createdAt: draft.createdAt,
    lines: draft.lines.map((line) => line.text),
    week: isoWeek(new Date(draft.createdAt)),
    addedItemIds: existing?.addedItemIds ?? [],
    sentenceIds: sentences.map((sentence) => sentence.id),
  };
  if (photo) capture.photo = photo;
  const lesson = draft.lesson ?? existing?.lesson;
  if (lesson) capture.lesson = lesson;
  await repos.captures.put(capture);
  return capture;
}

function sourceFor(capture: Capture, lesson: string | undefined, now: number): Source {
  const source: Source = {
    kind: 'capture',
    captureId: capture.id,
    week: capture.week,
    addedAt: now,
  };
  if (lesson) source.lesson = lesson;
  return source;
}

async function addWords(repos: Repos, ids: readonly string[], source: Source, now: number) {
  const existing = await repos.items.getMany(ids.map((id) => itemId('word', id)));
  const fresh = ids
    .filter((_, i) => existing[i] === undefined)
    .map((wordId) => ({ ...newWordItem({ wordId, kind: 'capture', now }), source }));
  await repos.items.putMany(fresh);
  return fresh.map((item) => item.id);
}

function grammarItem(id: string, source: Source, now: number): Item {
  const ref = id;
  return {
    id: itemId('grammar', ref),
    kind: 'grammar',
    ref,
    level: 0,
    card: newCard(now),
    source,
    updatedAt: now,
  };
}

/** The stored grammar point merged with this capture's examples and lesson. */
function mergePoint(
  id: string,
  stored: GrammarPoint | undefined,
  draft: GrammarDraft,
  context: { capture: Capture; lesson: string | undefined },
): GrammarPoint {
  const { capture, lesson } = context;
  const examples = capture.sentenceIds.filter((_, i) => capture.lines[i]?.includes(id));
  const point: GrammarPoint = {
    id,
    pattern: stored?.pattern ?? `〜${id}`,
    meaning: stored?.meaning || (draft.meaning ?? ''),
    exampleSentenceIds: [...new Set([...(stored?.exampleSentenceIds ?? []), ...examples])],
  };
  const tag = stored?.lesson ?? lesson;
  if (tag) point.lesson = tag;
  return point;
}

async function addGrammarPoint(
  repos: Repos,
  draft: GrammarDraft,
  capture: Capture,
  source: Source,
) {
  const id = grammarIdOf(draft.pattern);
  if (!id) return [];
  const stored = await repos.grammar.get(id);
  await repos.grammar.put(mergePoint(id, stored, draft, { capture, lesson: source.lesson }));
  if (await repos.items.get(itemId('grammar', id))) return [];
  await repos.items.put(grammarItem(id, source, source.addedAt));
  return [itemId('grammar', id)];
}

async function addGrammar(repos: Repos, input: AddCaptureInput, capture: Capture, source: Source) {
  const created: ItemId[] = [];
  for (const draft of input.grammar) {
    created.push(...(await addGrammarPoint(repos, draft, capture, source)));
  }
  return created;
}

/**
 * Adds the ticked words and grammar points of a capture (C3, K5): new items with a fresh card and
 * a `capture` source carrying the capture id, the lesson and the capture's ISO week; new grammar
 * points with the capture lines that use them as examples. Saves the capture and its sentences
 * (C5). Idempotent: existing items are left as they are, so pressing twice adds nothing.
 */
export async function addCaptureItems(
  repos: Repos,
  input: AddCaptureInput,
): Promise<AddCaptureResult> {
  const lesson = input.lesson?.trim() || undefined;
  const draft = lesson ? { ...input.capture, lesson } : input.capture;
  const grammarIds = input.grammar.map((g) => grammarIdOf(g.pattern)).filter(Boolean);
  const saved = await saveCapture(repos, draft, grammarIds);
  const source = sourceFor(saved, lesson, input.now);
  const words = await addWords(repos, [...new Set(input.words)], source, input.now);
  const grammar = await addGrammar(repos, input, saved, source);
  const created = [...words, ...grammar];
  const capture = { ...saved, addedItemIds: [...new Set([...saved.addedItemIds, ...created])] };
  await repos.captures.put(capture);
  return { capture, created };
}

/**
 * Whether a line can carry a session card once its new words are tracked. 'not-next' is a line
 * that passes i+1 but that the next session will not serve first (a reading JMdict does not
 * confirm, an older word not due, or shown in the last week).
 */
export type ExerciseOutcome = 'next-session' | 'not-next' | 'too-many-new' | 'all-known';

export interface ExerciseInput {
  capture: CaptureDraft;
  /** Index of the line in the capture. */
  line: number;
  /** New words of that line to add. */
  words: readonly string[];
  lesson?: string;
  now: number;
}

/**
 * "Turn into an exercise" (C4): saves the capture, adds the line's new words as items, and says
 * honestly whether the next session serves the line: 'next-session' only when it passes the
 * same priority check `buildSession` uses for the learner's own sentences (`ownPriority`).
 */
export async function exerciseFromLine(
  repos: Repos,
  input: ExerciseInput,
): Promise<ExerciseOutcome> {
  const { line, ...rest } = input;
  await addCaptureItems(repos, { ...rest, grammar: [] });
  const sentence = await repos.sentences.get(captureSentenceId(input.capture.id, line));
  if (!sentence) return 'too-many-new';
  const all = await repos.items.byKind('word');
  const levels = new Map(all.map((item) => [item.ref, item.level]));
  if (isIPlusOne(sentence, levels)) {
    const items = new Map(all.map((item) => [item.ref, item]));
    const own = await prioritised(repos, [sentence], { items, levels, now: input.now });
    return own.sentences.length > 0 ? 'next-session' : 'not-next';
  }
  return unknownTokens(sentence, levels).length === 0 ? 'all-known' : 'too-many-new';
}
