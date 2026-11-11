/**
 * A scanned lesson's pages as they are printed: each page a run of blocks in order (a heading, an
 * instruction, an exercise, a list, a text), with the lines and questions of each. An exercise
 * the app has no question type for stays in its place with its printed lines and the reason. A
 * page without stored blocks (pasted text, a scan made before pages kept their order) shows its
 * lines, then its exercises.
 */
import type {
  BlockKind,
  HandoutQuestion,
  PageKind,
  ScanBlock,
  ScannedLesson,
  ScanPage,
} from '../scan-types.ts';

/** A line of a block, with its index on the page. */
export interface BlockLine {
  index: number;
  text: string;
}

export interface BlockView {
  /** Its place on the page: with the page's index, what names an exercise to practise. */
  index: number;
  kind: BlockKind;
  lines: BlockLine[];
  /** An exercise's questions, in printed order; empty for any other kind. */
  questions: HandoutQuestion[];
  reason?: string;
}

export interface PageView {
  index: number;
  kind: PageKind;
  blocks: BlockView[];
  /** A photo the tutor read before pages kept their order: not shown as printed. */
  unordered: boolean;
}

/** The blocks of a page stored without any: all its lines, then its questions. */
function plainBlocks(page: ScanPage, questions: readonly HandoutQuestion[]): ScanBlock[] {
  const text: ScanBlock = { kind: 'text', lines: page.lines.map((_, i) => i) };
  const asked: ScanBlock = { kind: 'exercise', lines: [], questions: questions.map((q) => q.id) };
  return [...(text.lines.length > 0 ? [text] : []), ...(questions.length > 0 ? [asked] : [])];
}

function blockView(
  block: ScanBlock,
  index: number,
  page: ScanPage,
  questions: readonly HandoutQuestion[],
): BlockView {
  const lines = block.lines.flatMap((i) => {
    const line = page.lines[i];
    return line ? [{ index: i, text: line.text }] : [];
  });
  const asked = (block.questions ?? []).flatMap((id) => questions.find((q) => q.id === id) ?? []);
  const view: BlockView = { index, kind: block.kind, lines, questions: asked };
  if (block.reason) view.reason = block.reason;
  return view;
}

/** An exercise shows its questions; with none left it is only its printed lines. */
const shown = (view: BlockView): BlockView =>
  view.kind === 'exercise' && view.questions.length === 0 ? { ...view, kind: 'text' } : view;

function pageView(lesson: ScannedLesson, page: ScanPage, index: number): PageView {
  const questions = lesson.questions.filter((q) => q.page === index);
  const blocks = page.blocks ?? plainBlocks(page, questions);
  return {
    index,
    kind: page.kind,
    blocks: blocks
      .map((block, b) => shown(blockView(block, b, page, questions)))
      .filter((view) => view.lines.length + view.questions.length > 0),
    unordered: page.blocks === undefined && page.read === true,
  };
}

/** The lesson's pages, each as its blocks in printed order (see the module comment). */
export function scanPages(lesson: ScannedLesson): PageView[] {
  return lesson.pages.map((page, index) => pageView(lesson, page, index));
}

/** An exercise of a lesson, by its page and its block on the page. */
export interface ExerciseRef {
  page: number;
  block: number;
}

/** "2.3": the exercise as a link names it. */
export function exerciseParam(ref: ExerciseRef): string {
  return `${ref.page}.${ref.block}`;
}

/** The exercise a link names; undefined when it names none. */
export function parseExercise(param: string | null | undefined): ExerciseRef | undefined {
  const match = /^(\d+)\.(\d+)$/u.exec(param ?? '');
  return match ? { page: Number(match[1]), block: Number(match[2]) } : undefined;
}

/** The questions of one exercise, in printed order; none when the lesson has no such exercise. */
export function exerciseQuestions(lesson: ScannedLesson, ref: ExerciseRef): HandoutQuestion[] {
  const block = scanPages(lesson)[ref.page]?.blocks.find((view) => view.index === ref.block);
  return block?.questions ?? [];
}

/** How many exercises of a page could not be imported. */
export function unsupportedCount(page: Pick<ScanPage, 'blocks'>): number {
  return (page.blocks ?? []).filter((block) => block.kind === 'unsupported').length;
}
