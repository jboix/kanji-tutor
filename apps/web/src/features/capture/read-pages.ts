/**
 * Reading the pages of a scan: each photo is one request to the tutor (what the page is, its
 * lines, what it teaches, a handout's questions answered), and its lines are tokenized here;
 * pasted text is only tokenized, offline and without AI.
 */
import type { AiClient, AnalysedQuestion, PageAnalysis } from '../../ai/types.ts';
import type { PageDraft, QuestionDraft } from '../../domain/services/index.ts';
import type { Lang } from '../../lang/types.ts';
import { prepareImage } from './image.ts';
import type { ReadProblem } from './scan-copy.ts';

/** A page picked on the import screen: a photo, or pasted text. */
export type ImportPage =
  | { id: string; kind: 'photo'; file: Blob }
  | { id: string; kind: 'text'; text: string };

/** Non-empty trimmed lines of pasted text. */
export function cleanLines(text: string): string[] {
  return text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

type Tokenize = Lang['tokenize'];

async function tokenized(tokenize: Tokenize, text: string, verified: boolean) {
  return { text, verified, tokens: await tokenize(text) };
}

function questionDraft(q: AnalysedQuestion): QuestionDraft {
  const readings = q.readings.map(({ surface, reading, verified }) => ({
    surface,
    reading,
    verified,
  }));
  return { ...q, readings };
}

/** The tutor's reading of a page as a page draft. */
export async function pageFromAnalysis(
  tokenize: Tokenize,
  analysis: PageAnalysis,
  photo: Blob,
): Promise<PageDraft> {
  const lines = await Promise.all(
    analysis.lines.map((line) => tokenized(tokenize, line.text, !line.unsure)),
  );
  const listed = {
    kanji: analysis.kanji.map((k) => ({ text: k.char, meaning: k.meaning })),
    words: analysis.words.map(({ written, meaning, reading }) => ({
      text: written,
      meaning,
      reading: { surface: reading.surface, reading: reading.reading, verified: reading.verified },
    })),
    grammar: analysis.grammar.map((g) => ({ text: g.pattern, meaning: g.meaning })),
  };
  const questions = analysis.questions.map(questionDraft);
  return { photo, kind: analysis.kind, lines, listed, questions, title: analysis.title };
}

/** Pasted text as a page draft: a reading passage the learner can change, read on the device. */
export async function pageFromText(tokenize: Tokenize, text: string): Promise<PageDraft> {
  const lines = await Promise.all(cleanLines(text).map((line) => tokenized(tokenize, line, true)));
  return { kind: 'reading', lines, questions: [] };
}

export type ReadResult = { ok: true; pages: PageDraft[] } | { ok: false; problem: ReadProblem };

export interface ReadInput {
  client: AiClient | undefined;
  tokenize: Tokenize;
  pages: readonly ImportPage[];
  /** Called before each photo is sent: its number and the photos' count. */
  onPage: (n: number, total: number) => void;
}

type PhotoRead = { ok: true; page: PageDraft } | { ok: false; problem: ReadProblem };

async function readPhoto(
  input: ReadInput,
  file: Blob,
  n: number,
  total: number,
): Promise<PhotoRead> {
  const { client } = input;
  if (!client) return { ok: false, problem: { kind: 'crash', detail: 'no client' } };
  input.onPage(n, total);
  const image = await prepareImage(file);
  const result = await client.analysePage({ image: image.media, page: n, pages: total });
  if (!result.ok) return { ok: false, problem: { kind: 'ai', error: result.error } };
  if (result.value.lines.length === 0) return { ok: false, problem: { kind: 'no-text', page: n } };
  return { ok: true, page: await pageFromAnalysis(input.tokenize, result.value, image.blob) };
}

/** Reads every page in order, one request per photo; stops at the first problem. */
export async function readPages(input: ReadInput): Promise<ReadResult> {
  const total = input.pages.filter((p) => p.kind === 'photo').length;
  if (total > 0 && !navigator.onLine) {
    return { ok: false, problem: { kind: 'ai', error: { kind: 'offline', message: '' } } };
  }
  const drafts: PageDraft[] = [];
  let n = 0;
  for (const page of input.pages) {
    if (page.kind === 'text') {
      drafts.push(await pageFromText(input.tokenize, page.text));
      continue;
    }
    n += 1;
    const read = await readPhoto(input, page.file, n, total);
    if (!read.ok) return read;
    drafts.push(read.page);
  }
  return { ok: true, pages: drafts };
}
