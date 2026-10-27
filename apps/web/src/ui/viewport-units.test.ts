/**
 * Guard: no stylesheet sizes anything by the large viewport (`lvh`, `vh` and their block
 * variants). On an iPhone, installed or in Safari, those are taller than what is visible, and a
 * screen sized by them pushes its bottom bar off the screen. The screen frame follows the
 * visual viewport, with `dvh` as its fallback; a share of the screen (a sheet's 40%) uses `dvh`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(import.meta.dirname, '..');

function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return stylesheets(path);
    return entry.name.endsWith('.css') ? [path] : [];
  });
}

const LARGE = /\d(?:l?vh|l?vb)\b/u;

describe('viewport units', () => {
  it('sizes nothing by the large viewport, which runs under an iPhone’s visible screen', () => {
    const found = stylesheets(SRC).flatMap((path) =>
      readFileSync(path, 'utf8')
        .split('\n')
        .flatMap((line, i) => (LARGE.test(line) ? [`${relative(SRC, path)}:${i + 1}`] : [])),
    );
    expect(found).toEqual([]);
  });
});
