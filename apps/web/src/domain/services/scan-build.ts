/**
 * Turning read pages into a scanned lesson: the lines become sentences, the items are matched
 * against our data (`scan-match.ts`), and each handout question gets an id and the items it
 * practises. Pages can be added to an existing lesson; its own pages and items stay first.
 */

import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import { detectEntries } from '../grammar/detect.ts';
import type { Repos } from '../repos.ts';
import type {
  HandoutQuestion,
  PageKind,
  ScanItem,
  ScannedLesson,
  ScanPage,
} from '../scan-types.ts';
import type { LearnerLevel, Sentence, Token } from '../types.ts';
import {
  type ListedItems,
  type MatchPage,
  matchScanItems,
  patternKey,
  plainKey,
} from './scan-match.ts';
import { type BuiltScan, scanItemKey, scanSentenceId } from './scans.ts';

/** A line as read and tokenized, before it is stored. */
export interface LineDraft {
  text: string;
  verified: boolean;
  tokens: Token[];
}

/** A handout question as the tutor read it, before it has an id. */
export type QuestionDraft = Omit<HandoutQuestion, 'id' | 'page' | 'practises'>;

/** One page as read: by the tutor from a photo, or pasted. */
export interface PageDraft {
  photo?: Blob | undefined;
  kind: PageKind;
  lines: LineDraft[];
  /** What the tutor listed from the page; absent for pasted text. */
  listed?: ListedItems | undefined;
  questions: QuestionDraft[];
  /** The tutor's suggested title for the page. */
  title?: string | undefined;
}

export interface ScanBuildInput {
  /** The lesson the pages are added to: an existing one, or `emptyScan`. */
  base: ScannedLesson;
  pages: readonly PageDraft[];
  level: LearnerLevel;
}

function sentenceOf(lesson: string, id: string, line: LineDraft, photo: boolean): Sentence {
  const wordIds = [...new Set(line.tokens.flatMap((t) => (t.wordId ? [t.wordId] : [])))];
  const grammarIds = [...new Set(detectEntries(GRAMMAR_CATALOGUE, line.tokens).map((m) => m.id))];
  const sentence: Sentence = {
    id,
    text: line.text,
    source: 'capture',
    sourceRef: lesson,
    tokens: line.tokens,
    wordIds,
    verified: line.verified,
  };
  if (grammarIds.length > 0) sentence.grammarIds = grammarIds;
  // Read from a photo by the tutor: the line keeps that mark wherever it shows (A18).
  if (photo) sentence.aiRead = true;
  return sentence;
}

function pageOf(draft: PageDraft, sentenceIds: readonly string[]): ScanPage {
  const lines = draft.lines.map((line, i) => ({
    text: line.text,
    verified: line.verified,
    sentenceId: sentenceIds[i] ?? '',
  }));
  const page: ScanPage = { kind: draft.kind, lines };
  if (draft.photo) page.photo = draft.photo;
  if (draft.listed) page.read = true;
  return page;
}

/** The answer written into the stem's blank, to see what the question uses. */
function filled(question: QuestionDraft): string {
  const blank = /[＿_]+|（\s*）|\(\s*\)/u;
  const stem = blank.test(question.stem)
    ? question.stem.replace(blank, question.answer)
    : `${question.stem} ${question.answer}`;
  return `${stem} ${question.target ?? ''}`;
}

/** Keys of the lesson's items a question's text uses. */
function practisedBy(question: QuestionDraft, items: readonly ScanItem[]): string[] {
  const text = filled(question);
  const plain = patternKey(text);
  const uses = (item: ScanItem) =>
    item.kind === 'grammar'
      ? plainKey(item.text).length > 0 && plain.includes(plainKey(item.text))
      : text.includes(item.text);
  return [...new Set(items.filter(uses).map(scanItemKey))];
}

function questionsOf(drafts: readonly PageDraft[], offset: number, items: readonly ScanItem[]) {
  return drafts.flatMap((draft, p) =>
    draft.questions.map(
      (q, n): HandoutQuestion => ({
        ...q,
        id: `${offset + p}-${n + 1}`,
        page: offset + p,
        practises: practisedBy(q, items),
      }),
    ),
  );
}

function matchPages(drafts: readonly PageDraft[], offset: number): MatchPage[] {
  return drafts.map((draft, p) => ({ page: offset + p, lines: draft.lines, listed: draft.listed }));
}

/** The base items first, then the new pages' items not in them. */
function mergedItems(base: readonly ScanItem[], added: readonly ScanItem[]): ScanItem[] {
  const keys = new Set(base.map(scanItemKey));
  return [...base, ...added.filter((item) => !keys.has(scanItemKey(item)))];
}

function titled(base: ScannedLesson, drafts: readonly PageDraft[]): ScannedLesson {
  const suggested =
    base.suggestedTitle || (drafts.find((d) => d.title?.trim())?.title?.trim() ?? '');
  return { ...base, suggestedTitle: suggested, title: base.title || suggested };
}

/** The pages added to the lesson (see the module comment), with their sentences. */
export async function buildScan(repos: Repos, input: ScanBuildInput): Promise<BuiltScan> {
  const { base, pages: drafts, level } = input;
  const offset = base.pages.length;
  const ids = drafts.map((d, p) => d.lines.map((_, l) => scanSentenceId(base.id, offset + p, l)));
  const sentences = drafts.flatMap((draft, p) =>
    draft.lines.map((line, l) =>
      sentenceOf(base.id, ids[p]?.[l] ?? '', line, draft.photo !== undefined),
    ),
  );
  const found = await matchScanItems(repos, matchPages(drafts, offset), { level });
  const items = mergedItems(base.items, found);
  const lesson: ScannedLesson = {
    ...titled(base, drafts),
    pages: [...base.pages, ...drafts.map((draft, p) => pageOf(draft, ids[p] ?? []))],
    items,
    questions: [...base.questions, ...questionsOf(drafts, offset, items)],
    matchVersion: SCAN_MATCH_VERSION,
  };
  return { lesson, sentences };
}

/** The tutor's lists of one stored page, from the lesson's items. */
function listedOn(lesson: ScannedLesson, page: number): ListedItems {
  const listed = (kind: ScanItem['kind']) =>
    lesson.items
      .filter((item) => item.page === page && item.from === 'tutor' && item.kind === kind)
      .map((item) => ({ text: item.text, meaning: item.meaning, reading: item.reading }));
  return { kanji: listed('kanji'), words: listed('word'), grammar: listed('grammar') };
}

async function storedPages(repos: Repos, lesson: ScannedLesson): Promise<MatchPage[]> {
  return Promise.all(
    lesson.pages.map(async (page, i) => {
      const sentences = await repos.sentences.getMany(page.lines.map((l) => l.sentenceId));
      const lines = sentences.map((s) => ({ tokens: s?.tokens ?? [] }));
      const listed = page.read ? listedOn(lesson, i) : undefined;
      return { page: i, lines, listed };
    }),
  );
}

/** Grammar points added from a capture before scanned lessons, as items. */
async function addedGrammar(repos: Repos, ids: readonly string[]): Promise<ScanItem[]> {
  const points = await repos.grammar.getMany(ids);
  return ids.map((ref, i) => {
    const text = points[i]?.pattern ?? `〜${ref}`;
    return { kind: 'grammar', text, ref, page: 0, from: 'text' };
  });
}

const addedRefs = (lesson: ScannedLesson, kind: 'word' | 'grammar') =>
  (lesson.addedItemIds ?? []).flatMap((id) =>
    id.startsWith(`${kind}:`) ? [id.slice(kind.length + 1)] : [],
  );

/**
 * How items are matched now: 2 offers the unread kanji of a page the tutor listed none for. A
 * lesson matched an older way is matched again when it opens.
 */
export const SCAN_MATCH_VERSION = 2;

/** The lesson's items should be matched again: a converted capture, or matched an older way. */
export function needsMatch(lesson: ScannedLesson): boolean {
  return lesson.unmatched === true || (lesson.matchVersion ?? 1) < SCAN_MATCH_VERSION;
}

/**
 * The items of a stored lesson matched again from its lines and the tutor's lists: for a capture
 * converted into a lesson (`unmatched`, with what was added from it), or after a line was fixed.
 */
export async function rematchScan(
  repos: Repos,
  lesson: ScannedLesson,
  level: LearnerLevel,
): Promise<ScannedLesson> {
  const pages = await storedPages(repos, lesson);
  const found = await matchScanItems(repos, pages, { level, wordIds: addedRefs(lesson, 'word') });
  const items = mergedItems(found, await addedGrammar(repos, addedRefs(lesson, 'grammar')));
  const { unmatched: _unmatched, ...rest } = lesson;
  return { ...rest, items, matchVersion: SCAN_MATCH_VERSION };
}
