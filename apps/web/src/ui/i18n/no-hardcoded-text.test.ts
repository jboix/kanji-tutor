/**
 * Guard: no hard-coded English in feature and shared UI components. Every JSX text node and
 * every user-facing string attribute with Latin letters must come from the message catalogues,
 * except brand names, units and level labels. New English text fails this test.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..', '..', '..');
const DIRS = ['src/features', 'src/ui'];
const SKIP = [/\.test\.tsx$/, /\/dev-gallery[^/]*\.tsx$/];
const ATTRS = new Set([
  'aria-label',
  'aria-description',
  'title',
  'placeholder',
  'alt',
  'label',
  'hint',
]);

/** Words that may stay as they are: brand names, level labels, units and codes. */
const ALLOWED =
  /\b(Gemini|Google|AI Studio|aistudio\.google\.com(\/apikey)?|JLPT|JMdict|KANJIDIC2?|Tatoeba|Minna|Tobira|Klee One|N[1-5]|KB|MB|GB|ms|px)\b/g;

/** Latin letters left once the allowed words are taken out; a lone letter is a symbol. */
const english = (text: string) => /[A-Za-z]{2,}/.test(text.replace(ALLOWED, ''));

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return files(path);
    return path.endsWith('.tsx') && !SKIP.some((re) => re.test(path)) ? [path] : [];
  });
}

function literalText(node: ts.Node | undefined): string | undefined {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(' ');
  }
  if (ts.isJsxExpression(node)) return literalText(node.expression);
  return undefined;
}

function attrText(node: ts.JsxAttribute): string | undefined {
  const name = node.name.getText();
  return ATTRS.has(name) ? literalText(node.initializer) : undefined;
}

function textOf(node: ts.Node): string | undefined {
  if (ts.isJsxText(node)) return node.text.trim();
  if (ts.isJsxAttribute(node)) return attrText(node);
  if (ts.isJsxExpression(node) && node.parent && !ts.isJsxAttribute(node.parent)) {
    return literalText(node.expression);
  }
  return undefined;
}

function violations(path: string): string[] {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const found: string[] = [];
  const visit = (node: ts.Node) => {
    const text = textOf(node);
    if (text !== undefined && english(text)) {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart());
      found.push(`${relative(ROOT, path)}:${line + 1}  ${JSON.stringify(text.slice(0, 60))}`);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe('hard-coded interface text', () => {
  it('finds none in src/features and src/ui components', () => {
    const found = DIRS.flatMap((dir) => files(join(ROOT, dir))).flatMap(violations);
    expect(found).toEqual([]);
  });
});
