import { resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { GRAMMAR_CATALOGUE } from '../../../src/domain/grammar/catalogue.ts';
import { detectEntry } from '../../../src/domain/grammar/detect.ts';
import {
  FUNCTION_WORDS,
  functionWordNotes,
  matchesAt,
} from '../../../src/domain/grammar/function-words.ts';
import type { Token } from '../../../src/domain/types.ts';
import { detectGrammar, grammarIdsOf } from './detect.ts';
import { N3_CASES } from './examples-n3.ts';
import { N4_CASES } from './examples-n4.ts';
import type { DetectCase } from './examples-n5.ts';
import { N5_CASES } from './examples-n5.ts';
import { PARTICLE_CASES } from './examples-particles.ts';
import { packTokenizer } from './tokenize.ts';

const CASES: readonly DetectCase[] = [...N5_CASES, ...N4_CASES, ...N3_CASES];
const ROOT = resolve(import.meta.dirname, '../../..');
let tokenize: (text: string) => Token[];

beforeAll(async () => {
  tokenize = await packTokenizer(ROOT);
}, 30_000);

function entry(id: string) {
  const found = GRAMMAR_CATALOGUE.find((e) => e.id === id);
  if (!found) throw new Error(`no grammar entry ${id}`);
  return found;
}

function describeTokens(tokens: readonly Token[]): string {
  return tokens.map((t) => `${t.surface}/${t.base}/${t.pos}`).join(' | ');
}

describe('grammar detectors on kuromoji tokens', () => {
  it.each(CASES)('%s · %s → %s', (id, sentence, hit) => {
    const tokens = tokenize(sentence);
    const match = detectEntry(entry(id), tokens);
    expect(match !== undefined, describeTokens(tokens)).toBe(hit);
    if (!match) return;
    const span = sentence.slice(match.from, match.to);
    expect(span, 'the span spells its tokens').toBe(
      tokens
        .slice(match.start, match.end)
        .map((t) => t.surface)
        .join(''),
    );
    const clozed = entry(id).cloze.some((text) => span.includes(text));
    expect(clozed, `span "${span}" has none of ${entry(id).cloze.join(', ')}`).toBe(true);
  });

  it('has a positive case for every catalogue entry', () => {
    const positive = new Set(CASES.filter(([, , hit]) => hit).map(([id]) => id));
    const missing = GRAMMAR_CATALOGUE.filter((e) => !positive.has(e.id)).map((e) => e.id);
    expect(missing).toEqual([]);
  });

  it('names only catalogue ids in its cases', () => {
    const ids = new Set(GRAMMAR_CATALOGUE.map((e) => e.id));
    expect(CASES.map(([id]) => id).filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe('detectGrammar', () => {
  it('finds every point a sentence uses, with offsets into the text', () => {
    const sentence = 'ここで写真を撮ってもいいですか。';
    const matches = detectGrammar(tokenize(sentence));
    const ids = matches.map((m) => m.id);
    expect(ids).toContain('te-mo-ii');
    expect(ids).toContain('ka-question');
    const teMoIi = matches.find((m) => m.id === 'te-mo-ii');
    expect(teMoIi && sentence.slice(teMoIi.from, teMoIi.to)).toBe('てもいい');
  });

  it('returns distinct ids and nothing for a sentence without grammar', () => {
    expect(grammarIdsOf([])).toEqual([]);
    const ids = grammarIdsOf(tokenize('毎日運動するようにしています。'));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

function word(id: string) {
  const found = FUNCTION_WORDS.find((w) => w.id === id);
  if (!found) throw new Error(`no particle entry ${id}`);
  return found;
}

describe('particle detectors on kuromoji tokens (G5)', () => {
  it.each(PARTICLE_CASES)('%s · %s (%s) → %s', (id, sentence, surface, hit) => {
    const tokens = tokenize(sentence);
    const at = tokens.findIndex((t) => t.surface === surface);
    expect(at, describeTokens(tokens)).toBeGreaterThanOrEqual(0);
    expect(matchesAt(word(id), tokens, at), describeTokens(tokens)).toBe(hit);
  });

  it('has a positive case for every entry', () => {
    const positive = new Set(PARTICLE_CASES.filter(([, , , hit]) => hit).map(([id]) => id));
    expect(FUNCTION_WORDS.map((w) => w.id).filter((id) => !positive.has(id))).toEqual([]);
  });

  it.each(FUNCTION_WORDS.flatMap((w) => w.uses.map((u) => [w.id, u.example] as const)))(
    '%s finds itself in its example %s',
    (id, example) => {
      const tokens = tokenize(example);
      const found = tokens.some((_, i) => matchesAt(word(id), tokens, i));
      expect(found, describeTokens(tokens)).toBe(true);
    },
  );

  it('explains a tapped particle by its entry and the catalogue points around it', () => {
    const tokens = tokenize('ここで写真を撮ってもいいですか。');
    const ka = tokens.findIndex((t) => t.surface === 'か');
    const notes = functionWordNotes(tokens, ka);
    expect(notes.words.map((w) => w.id)).toEqual(['particle-ka']);
    expect(notes.grammar.map((g) => g.id)).not.toContain('ka-question');
    const te = tokens.findIndex((t) => t.surface === 'て');
    expect(functionWordNotes(tokens, te).grammar.map((g) => g.id)).toContain('te-mo-ii');
  });
});
