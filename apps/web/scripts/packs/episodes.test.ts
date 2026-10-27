/**
 * The episodes against the published pack and the packs' tokenizer: every kanji is at or below
 * the unit's level (or in the words of this unit or an earlier one), no word with a known JLPT
 * level is above it, and the episode uses at least one of the unit's grammar points.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { CAST } from '../../src/domain/cast.ts';
import { EPISODES } from '../../src/domain/episodes/catalogue.ts';
import { GRAMMAR_CATALOGUE } from '../../src/domain/grammar/catalogue.ts';
import { detectEntry } from '../../src/domain/grammar/detect.ts';
import { UNITS } from '../../src/domain/themes/index.ts';
import { packTokenizer } from './grammar/tokenize.ts';

const ROOT = resolve(import.meta.dirname, '..', '..');
const PACKS = join(ROOT, 'public', 'packs');
const MANIFEST = join(PACKS, 'manifest.json');
// 々 repeats the kanji before it, which is checked itself.
const KANJI = /(?!々)\p{Script=Han}/u;

interface PackEntry {
  forms?: string[];
  char?: string;
  jlpt?: number;
}

function store(name: string): PackEntry[] {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
    files: { store: string; url: string }[];
  };
  return manifest.files
    .filter((file) => file.store === name)
    .flatMap((file) => JSON.parse(gunzipSync(readFileSync(join(PACKS, file.url))).toString()));
}

/** Kanji and words a unit may use: its level's and easier, and its own and earlier units' words. */
function allowance(level: number, order: number) {
  const words = UNITS.filter((u) => u.order <= order).flatMap((u) => u.words.map((w) => w.written));
  const chars = new Set([...words.join(''), ...CAST.map((m) => m.speaker).join('')]);
  const set = new Set(words);
  // A unit word the tokenizer splits (お土産 → 土産, 郵便局 → 郵便 + 局) still counts, and a
  // single kanji (的, 中) is left to the kanji check.
  const has = (token: { base: string; surface: string }) =>
    set.has(token.base) ||
    [...token.surface].length === 1 ||
    words.some((word) => word.includes(token.surface));
  return { has, chars, level };
}

describe.skipIf(!existsSync(MANIFEST))('the episodes in the published pack', () => {
  it.each([5, 4, 3] as const)(
    'stay at the N%i units’ level and use their grammar',
    async (level) => {
      const kanjiLevel = new Map(store('kanji').map((k) => [k.char ?? '', k.jlpt ?? 0]));
      const wordLevel = new Map<string, number>();
      // A spelling shared by several words takes the easiest level (来る is N5, not N1).
      for (const w of store('words'))
        for (const f of w.forms ?? []) {
          if (w.jlpt) wordLevel.set(f, Math.max(wordLevel.get(f) ?? 0, w.jlpt));
        }
      const tokens = await packTokenizer(ROOT);
      const problems: string[] = [];
      for (const unit of UNITS.filter((u) => u.level === level)) {
        const episode = EPISODES.find((e) => e.unitId === unit.id);
        if (!episode) continue;
        const allowed = allowance(level, unit.order);
        for (const line of episode.lines) {
          for (const char of line.ja) {
            const at = kanjiLevel.get(char) ?? 0;
            if (KANJI.test(char) && at < level && !allowed.chars.has(char)) {
              problems.push(`${unit.id}: ${char} (N${at || '?'}) in ${line.ja}`);
            }
          }
          for (const token of tokens(line.ja)) {
            const at = wordLevel.get(token.base) ?? wordLevel.get(token.surface);
            if (at && at < level && KANJI.test(token.surface) && !allowed.has(token)) {
              problems.push(`${unit.id}: word ${token.base} (N${at}) in ${line.ja}`);
            }
          }
        }
        const entries = GRAMMAR_CATALOGUE.filter((e) => unit.grammar.includes(e.id));
        const found = entries.some((entry) =>
          episode.lines.some((line) => detectEntry(entry, tokens(line.ja))),
        );
        if (!found) problems.push(`${unit.id}: none of ${unit.grammar.join(', ')} is used`);
      }
      expect(problems).toEqual([]);
    },
    120_000,
  );
});
