/**
 * Guard: every view that renders tutor output does so through the AI box (`AiBlock`, or
 * its request states), and no static teaching view uses the box, the seal or AI red. A new
 * AI result view belongs in `AI_VIEWS`; a new static one in `STATIC_VIEWS`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..', '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

/** Views that show what a task returned, or the state of a request for it. */
const AI_VIEWS = [
  'src/features/explain/word-sheet-parts.tsx',
  'src/features/explain/mistake-explanation.tsx',
  'src/features/explain/ask-box.tsx',
  'src/features/explain/follow-up-view.tsx',
  'src/features/explain/sentence-use.tsx',
  'src/features/explain/reading-hook.tsx',
  'src/features/explain/ai-status.tsx',
  'src/features/explain/tutor-sheet.tsx',
  'src/features/teach/memory-hook.tsx',
  'src/features/teach/sentence-help.tsx',
  'src/features/teach/ja-prose.tsx',
  'src/features/compose/correction-view.tsx',
  'src/features/compose/draft-editor.tsx',
  'src/features/capture/scan-import.tsx',
  'src/features/capture/review-items.tsx',
  'src/features/capture/lesson-lines.tsx',
  'src/features/read/handout-screen.tsx',
  'src/features/notes/letter-view.tsx',
  'src/features/placement/tutor-assessment.tsx',
  'src/features/kanji/kanji-story.tsx',
  'src/features/kanji/kanji-story-parts.tsx',
  'src/features/wild/wild-screen.tsx',
  'src/features/wild/wild-result.tsx',
  'src/features/wild/wild-parts.tsx',
  'src/features/handwrite/candidate-picker.tsx',
  'src/features/handwrite/status-line.tsx',
  'src/features/handwrite/draw-panel.tsx',
  'src/features/handwrite/describe-panel.tsx',
];

/** Static teaching content: dictionary, catalogue grammar, app notes, hints, the plan. */
const STATIC_VIEWS = [
  'src/features/explain/word-static.tsx',
  'src/features/explain/static-mistake.ts',
  'src/features/explain/particle-sheet.tsx',
  'src/features/teach/teaching-content.tsx',
  'src/features/teach/target-hint.tsx',
  'src/features/teach/new-item-intro.tsx',
  'src/features/teach/sentence-wrap-up.tsx',
  'src/features/teach/parts-hook.ts',
  'src/features/grammar/grammar-page.tsx',
  'src/features/grammar/grammar-intro.tsx',
  'src/features/kanji/kanji-detail-view.tsx',
  'src/features/kanji/reading-rows.tsx',
  'src/features/read/word-sheet.tsx',
  'src/features/capture/review-pages.tsx',
];

const AI_BOX = /ui\/ai-block\.tsx/;
const SEAL = /ai-seal\.tsx|['"]解['"]|>解</;

function featureFiles(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return featureFiles(path);
    return /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : [];
  });
}

/** The CSS module a view imports, if any. */
function cssOf(path: string): string | undefined {
  const module = /from '\.\/([\w-]+\.module\.css)'/.exec(read(path))?.[1];
  return module && join(path, '..', module);
}

describe('the AI box', () => {
  it.each(AI_VIEWS)('%s renders tutor output through the AI box', (path) => {
    expect(read(path)).toMatch(AI_BOX);
  });

  it('keeps the seal inside the AI box: no feature draws it on its own', () => {
    const drawn = featureFiles('src/features').filter((path) => SEAL.test(read(path)));
    expect(drawn.map((path) => relative(ROOT, join(ROOT, path)))).toEqual([]);
  });

  it.each(STATIC_VIEWS)('%s is static: no AI box, no seal', (path) => {
    const source = read(path);
    expect(source).not.toMatch(AI_BOX);
    expect(source).not.toMatch(SEAL);
  });

  it('lists every file that runs a task: AI views, hooks or services', () => {
    const calls = /\bclient\.(?!peek)\w+\(|useAiState|useAiResult/;
    const running = featureFiles('src/features').filter((path) => calls.test(read(path)));
    const hook = (path: string) => /\/use-[\w-]+\.tsx$/.test(path) || !path.endsWith('.tsx');
    const viewOrHook = (path: string) => AI_VIEWS.includes(path) || hook(path);
    expect(running.filter((path) => !viewOrHook(path))).toEqual([]);
  });

  it('keeps AI red out of the static views’ styles', () => {
    const sheets = STATIC_VIEWS.flatMap((path) => cssOf(path) ?? []);
    const aiRed = /var\(--ai\)/;
    const classes = (css: string) =>
      [...css.matchAll(/\.([\w-]+)\s*\{[^}]*var\(--ai\)/g)].map((m) => m[1]);
    for (const sheet of new Set(sheets)) {
      const css = read(sheet);
      if (!aiRed.test(css)) continue;
      const used = classes(css).filter((name) =>
        STATIC_VIEWS.some((view) => read(view).includes(`styles.${name}`)),
      );
      expect({ sheet, used }).toEqual({ sheet, used: [] });
    }
  });

  /** Static exercises, grading and navigation: never the AI red (A18). */
  const STATIC_SHEETS = [
    'src/features/read/question.module.css',
    'src/features/read/read.module.css',
    'src/features/grammar/grammar.module.css',
    'src/features/teach/teach.module.css',
    'src/ui/ja.module.css',
    'src/ui/answer-state.module.css',
    'src/ui/session-progress.module.css',
    'src/ui/bottom-nav.module.css',
  ];

  it.each(STATIC_SHEETS)('%s never uses the AI red', (sheet) => {
    expect(read(sheet)).not.toMatch(/var\(--ai\)/);
  });
});
