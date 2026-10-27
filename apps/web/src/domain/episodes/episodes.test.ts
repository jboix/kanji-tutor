import { describe, expect, it } from 'vitest';
import { CAST } from '../cast.ts';
import { UNITS } from '../themes/index.ts';
import { EPISODES } from './catalogue.ts';
import type { Episode } from './types.ts';

const LANGS = ['en', 'fr', 'es'] as const;
const CAST_IDS = new Set(CAST.map((member) => member.id));
const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/** The written form's stem, so a conjugated verb or adjective still counts (捨てる → 捨て). */
const stem = (written: string) =>
  /[るうくぐすつぬぶむいた]$/.test(written) ? written.slice(0, -1) : written;

function problems(episode: Episode): string[] {
  const unit = UNITS.find((u) => u.id === episode.unitId);
  if (!unit) return [`${episode.unitId}: no such unit`];
  const out: string[] = [];
  const cast = new Set(episode.cast);
  if (cast.size !== episode.cast.length || cast.size < 2 || cast.size > 3) out.push('cast of 2–3');
  if (episode.cast.some((id) => !CAST_IDS.has(id))) out.push('unknown cast member');
  if (episode.lines.length < 6 || episode.lines.length > 10) out.push('6–10 lines');
  for (const id of cast)
    if (!episode.lines.some((l) => l.by === id)) out.push(`${id} never speaks`);
  for (const [i, line] of episode.lines.entries()) {
    if (!cast.has(line.by)) out.push(`line ${i}: speaker not in the cast`);
    if (!JAPANESE.test(line.ja) || /[A-Za-z]/.test(line.ja)) out.push(`line ${i}: Japanese only`);
    if (line.ja.length > 60) out.push(`line ${i}: over 60 characters`);
    for (const lang of LANGS) if (!line.tr[lang].trim()) out.push(`line ${i}: no ${lang}`);
  }
  for (const lang of LANGS) {
    const title = episode.title[lang].trim();
    if (!title || title.length > 40) out.push(`title ${lang}: 1–40 characters`);
  }
  const text = episode.lines.map((l) => l.ja).join('');
  const used = unit.words.filter((w) => text.includes(stem(w.written)));
  if (used.length < 3) out.push(`uses ${used.length} of the unit's words, at least 3`);
  return out.map((p) => `${episode.unitId}: ${p}`);
}

describe.each([5, 4, 3] as const)('the N%i episodes', (level) => {
  const units = UNITS.filter((u) => u.level === level);
  const episodes = EPISODES.filter((e) => units.some((u) => u.id === e.unitId));

  it('give every unit of the level exactly one episode', () => {
    const ids = episodes.map((e) => e.unitId);
    expect(ids).toEqual(units.map((u) => u.id));
  });

  it('are well formed: the cast, 6–10 lines, three translations, the unit’s words', () => {
    expect(episodes.flatMap(problems)).toEqual([]);
  });
});
