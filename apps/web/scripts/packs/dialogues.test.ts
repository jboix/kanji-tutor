/**
 * The grammar dialogues against the catalogue's detectors, with the packs' tokenizer: the point
 * of each dialogue is found in its blanked line, where the focus stands, so the line really
 * uses it.
 */
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRAMMAR_DIALOGUES } from '../../src/domain/dialogues/catalogue.ts';
import { focusRange } from '../../src/domain/dialogues/index.ts';
import { GRAMMAR_CATALOGUE } from '../../src/domain/grammar/catalogue.ts';
import { detectEntry } from '../../src/domain/grammar/detect.ts';
import { packTokenizer } from './grammar/tokenize.ts';

const ROOT = resolve(import.meta.dirname, '..', '..');

describe('grammar dialogues', () => {
  it('use their point where the blanked focus stands', async () => {
    const tokens = await packTokenizer(ROOT);
    const problems: string[] = [];
    for (const set of GRAMMAR_DIALOGUES) {
      const entry = GRAMMAR_CATALOGUE.find((e) => e.id === set.grammarId);
      for (const dialogue of set.dialogues) {
        const line = dialogue.lines[dialogue.blank.line];
        const range = line && focusRange(line);
        const match = entry && line && detectEntry(entry, tokens(line.ja));
        const overlaps = match && range && match.from < range.to && match.to > range.from;
        if (!overlaps) problems.push(`${dialogue.id}: ${set.grammarId} not found at the focus`);
      }
    }
    expect(problems).toEqual([]);
  }, 60_000);
});
