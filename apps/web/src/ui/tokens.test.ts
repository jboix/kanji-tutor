/**
 * Guard (B2): every text and UI pair in `tokens.css` passes WCAG AA in light and dark.
 * The ratios use the WCAG 2.x relative luminance formula.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..', '..');
const css = readFileSync(join(ROOT, 'src/ui/tokens.css'), 'utf8');

type Palette = Record<string, string>;

function tokens(block: string): Palette {
  const entries = [...block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})\b/gi)];
  return Object.fromEntries(entries.map(([, name, hex]) => [name, hex]));
}

/** The light block (`:root`) and the explicit dark block (`[data-theme="dark"]`). */
function palettes(): { light: Palette; dark: Palette; systemDark: Palette } {
  const light = css.slice(css.indexOf(':root,'), css.indexOf('@media'));
  const systemDark = css.slice(css.indexOf('@media'), css.indexOf(':root[data-theme="dark"]'));
  const dark = css.slice(css.indexOf(':root[data-theme="dark"]'));
  return { light: tokens(light), dark: tokens(dark), systemDark: tokens(systemDark) };
}

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((at) =>
    channel(Number.parseInt(hex.slice(at, at + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/** Whether any stylesheet sets text in --ink-faint (then it needs 4.5:1, not 3:1). */
function faintIsText(): boolean {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return walk(path);
      return path.endsWith('.css') ? [path] : [];
    });
  return walk(join(ROOT, 'src')).some((path) =>
    /(^|[\s;{])color:\s*var\(--ink-faint\)/m.test(readFileSync(path, 'utf8')),
  );
}

const TEXT = ['ink', 'ink-muted', 'accent', 'ai', 'ok', 'miss'];
const SURFACES = ['paper', 'paper-soft'];

/** The answer cards: their text, the muted lines on them, the marks on their circles. */
const CARDS = [
  ['ok-ink', 'ok-surface'],
  ['ink-muted', 'ok-surface'],
  ['on-ok', 'ok'],
  ['miss-ink', 'miss-surface'],
  ['ink', 'miss-surface'],
  ['ink-muted', 'miss-surface'],
  ['on-miss', 'miss'],
  ['on-hero', 'hero'],
  ['hero-muted', 'hero'],
] as const;

describe.each(['light', 'dark', 'systemDark'] as const)('%s tokens', (theme) => {
  const palette = palettes()[theme];
  const ratio = (fg: string, bg: string) => contrast(palette[fg] ?? '', palette[bg] ?? '');

  it.each(TEXT.flatMap((fg) => SURFACES.map((bg) => [fg, bg])))('%s on %s ≥ 4.5:1', (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(SURFACES)('ink-faint on %s meets its use', (bg) => {
    expect(ratio('ink-faint', bg)).toBeGreaterThanOrEqual(faintIsText() ? 4.5 : 3);
  });

  it.each(['rule', 'border'])('%s stays visible on paper', (line) => {
    expect(ratio(line, 'paper')).toBeGreaterThanOrEqual(1.3);
  });

  it('keeps on-ink and on-ai readable', () => {
    expect(ratio('on-ink', 'ink')).toBeGreaterThanOrEqual(4.5);
    expect(ratio('on-ai', 'ai')).toBeGreaterThanOrEqual(4.5);
  });

  it.each(CARDS)('%s on %s ≥ 4.5:1 (answer cards, Next up)', (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('dark tokens', () => {
  it('are the same for the system preference and an explicit choice', () => {
    const { dark, systemDark } = palettes();
    expect(systemDark).toEqual(dark);
  });
});
