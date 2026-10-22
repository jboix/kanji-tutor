/**
 * Guard (A18, D64): a feature starts an AI task only through the `AiAction` path in
 * `ui/ai-action.tsx`. The client reaches a feature only as the argument of `run`, `peek` or
 * `onAsk`, so any `services.ai`, `useServices().ai` or `{ ai } = …` in a feature is a press the
 * learner could not see coming. The check reads each file's syntax tree, not its text.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..', '..');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');

function featureFiles(dir: string): string[] {
  return readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return featureFiles(path);
    return /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : [];
  });
}

/** AI calls outside a task: allowed only in the file named, whose button is an `AiAction`. */
const DIRECT_CALLS: Readonly<Record<string, string>> = {
  testKey: 'src/features/settings/use-key-test.ts',
};

/** Flows whose request goes out after a non-button press (a hold); the control carries the mark. */
const PRESS_FLOWS = ['src/features/voice/use-voice-answer.ts'];

const AI_MODULE = /\/ai\/index\.ts$/;
const RUNTIME_AI = ['createAiClient', 'createGeminiProvider', 'createMockProvider', 'lazyTask'];

function bindsAi(node: ts.BindingElement): boolean {
  const key = node.propertyName ?? node.name;
  return ts.isIdentifier(key) && key.text === 'ai';
}

function importViolations(node: ts.ImportDeclaration, path: string): string[] {
  const from = (node.moduleSpecifier as ts.StringLiteral).text;
  const named = node.importClause?.namedBindings;
  if (!AI_MODULE.test(from) || !named || !ts.isNamedImports(named)) return [];
  if (node.importClause?.isTypeOnly) return [];
  return named.elements.flatMap((element) => {
    const name = (element.propertyName ?? element.name).text;
    if (RUNTIME_AI.includes(name)) return [`imports ${name}`];
    const allowed = DIRECT_CALLS[name];
    return allowed !== undefined && allowed !== path ? [`imports ${name}`] : [];
  });
}

function nodeViolation(node: ts.Node, path: string): string | undefined {
  if (ts.isPropertyAccessExpression(node) && node.name.text === 'ai') return 'reads .ai';
  if (ts.isElementAccessExpression(node) && ts.isStringLiteral(node.argumentExpression)) {
    if (node.argumentExpression.text === 'ai') return "reads ['ai']";
  }
  if (ts.isBindingElement(node) && bindsAi(node)) return 'destructures ai';
  const pressFlow = ts.isCallExpression(node) && node.expression.getText() === 'useAiPress';
  if (pressFlow && !PRESS_FLOWS.includes(path)) return 'calls useAiPress';
  return undefined;
}

/** Every way the file reaches the AI client other than through the `AiAction` path. */
function violations(path: string, source: string): string[] {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) found.push(...importViolations(node, path));
    const one = nodeViolation(node, path);
    if (one) found.push(`${one} (line ${file.getLineAndCharacterOfPosition(node.pos).line + 1})`);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

/**
 * The AI presses and the files that render them: each must use the AiAction
 * path (`AiAction`, `AiForm`/`AiSubmit`, `AiAskInput`, or the mark of `AiActionContent`).
 */
const PRESSES: Readonly<Record<string, string>> = {
  'Ask the tutor why (mistake)': 'src/features/explain/mistake-explanation.tsx',
  'Ask about this word, break down': 'src/features/explain/word-sheet-parts.tsx',
  'What it does in this sentence': 'src/features/explain/sentence-use.tsx',
  'Follow-up chips': 'src/features/explain/use-chips.tsx',
  'Write a new one (one more example)': 'src/features/explain/follow-up-view.tsx',
  'Ask box submit': 'src/features/explain/ask-box.tsx',
  'Kanji reading hook': 'src/features/explain/reading-hook.tsx',
  'Memory hook (teaching card)': 'src/features/teach/memory-hook.tsx',
  'Explain this sentence: ask the tutor': 'src/features/teach/sentence-help.tsx',
  'Compose Check': 'src/features/compose/compose-screen.tsx',
  'Capture photo': 'src/features/capture/start-controls.tsx',
  'Capture another photo': 'src/features/capture/capture-view.tsx',
  'Capture line': 'src/features/capture/capture-lines.tsx',
  'Voice record': 'src/features/voice/voice-answer.tsx',
  'Handwriting AI fallback': 'src/features/handwrite/draw-panel.tsx',
  'Describe a kanji': 'src/features/handwrite/describe-panel.tsx',
  'Weekly letter': 'src/features/notes/letter-view.tsx',
  'Assess my level': 'src/features/placement/tutor-assessment.tsx',
  'Test key': 'src/features/settings/key-section.tsx',
  'Retry after a rate limit': 'src/ui/rate-limit-notice.tsx',
};

const MARKED = /<AiAction\b|<AiSubmit\b|<AiAskInput\b|<AiActionContent\b/;

describe('the AiAction path (A18)', () => {
  it.each(featureFiles('src/features'))(
    '%s reaches the AI client only through AiAction',
    (path) => {
      expect(violations(path, read(path))).toEqual([]);
    },
  );

  it.each(Object.entries(PRESSES))('%s is an AiAction (%s)', (_, path) => {
    expect(read(path)).toMatch(MARKED);
  });

  it('catches each way around it', () => {
    const bad = [
      'const { ai } = useServices(); void ai.explainWord(input);',
      'const services = useServices(); void services.ai.followUp(input);',
      'void useServices().ai.memoryHook(input);',
      'const { ai: client } = useServices();',
      "const s = useServices(); void s['ai'];",
      "import { testKey } from '../../ai/index.ts';",
      "import { lazyTask } from '../../ai/index.ts';",
      'const press = useAiPress();',
    ];
    for (const source of bad) {
      expect(violations('src/features/explain/x.tsx', source), source).not.toEqual([]);
    }
  });

  it('lets the client in through run, peek and onAsk', () => {
    const good = [
      '<AiAction label="Ask" run={(client) => start(() => client.explainWord(input))} />',
      'const peek = (client: AiClient) => client.peek("explainWord", input);',
      "import type { AiClient } from '../../ai/index.ts';",
      "import { testKey } from '../../ai/index.ts';",
    ];
    const path = DIRECT_CALLS.testKey ?? '';
    for (const source of good) expect(violations(path, source), source).toEqual([]);
  });
});
