import { describe, expect, it } from 'vitest';
import type { Token } from '../types.ts';
import { detectEntries, detectEntry, findSpan, toGrammarPoint } from './detect.ts';
import {
  alt,
  b,
  behind,
  end,
  gap,
  not,
  notBehind,
  notPrev,
  opt,
  prev,
  s,
  seq,
  stop,
  text,
  tok,
} from './dsl.ts';
import type { GrammarEntry } from './types.ts';

/** Hand-built tokens in the pack's shape: [surface, base, pos]. */
function tokens(...parts: [string, string, string][]): Token[] {
  let start = 0;
  return parts.map(([surface, base, pos]) => {
    const token: Token = { surface, reading: surface, base, pos, start };
    start += surface.length;
    return token;
  });
}

// 本を読んでもいい。
const SENTENCE = tokens(
  ['本', '本', 'noun'],
  ['を', 'を', 'particle'],
  ['読ん', '読む', 'verb'],
  ['で', 'で', 'particle'],
  ['も', 'も', 'particle'],
  ['いい', 'いい', 'adjective'],
  ['。', '。', 'symbol'],
);

const ENTRY: GrammarEntry = {
  id: 'te-mo-ii',
  pattern: '〜てもいい',
  level: 5,
  family: 'permission',
  meaning: 'may',
  formation: 'V-て + もいい',
  explanation: 'Permission.',
  cloze: ['てもいい'],
  rule: seq(prev({ pos: 'verb' }), s('で'), s('も'), b('いい')),
};

describe('matcher DSL', () => {
  it('matches tokens by surface, base, pos, inflection and ending', () => {
    expect(tok({ base: '読む', plain: false })(SENTENCE, 2)).toEqual([3]);
    expect(tok({ base: '読む', plain: true })(SENTENCE, 2)).toEqual([]);
    expect(tok({ pos: ['adjective'], ends: 'い' })(SENTENCE, 5)).toEqual([6]);
    expect(tok({ reading: 'ほん' })(SENTENCE, 0)).toEqual([]);
    expect(s('本')(SENTENCE, 99)).toEqual([]);
  });

  it('backtracks through sequences, alternatives and optional parts', () => {
    const rule = seq(opt(s('本')), alt(s('を'), s('が')), gap(2), s('も'));
    expect(rule(SENTENCE, 0)).toEqual([5]);
    expect(rule(SENTENCE, 1)).toEqual([5]);
  });

  it('checks context without consuming it', () => {
    expect(not(s('を'))(SENTENCE, 1)).toEqual([]);
    expect(not(s('が'))(SENTENCE, 1)).toEqual([1]);
    expect(notPrev({ surface: '本' })(SENTENCE, 1)).toEqual([]);
    expect(notPrev({ surface: '本' })(SENTENCE, 2)).toEqual([2]);
    expect(end(SENTENCE, 6)).toEqual([6]);
    expect(end(SENTENCE, 7)).toEqual([7]);
    expect(end(SENTENCE, 5)).toEqual([]);
    expect(stop(SENTENCE, 6)).toEqual([6]);
    expect(stop(SENTENCE, 5)).toEqual([]);
  });

  it('looks behind a few tokens', () => {
    const teMo = seq(s('で'), s('も'));
    expect(behind(teMo)(SENTENCE, 5)).toEqual([5]);
    expect(behind(teMo)(SENTENCE, 4)).toEqual([]);
    expect(notBehind(teMo)(SENTENCE, 5)).toEqual([]);
    expect(notBehind(teMo)(SENTENCE, 4)).toEqual([4]);
  });

  it('never gaps across the end of a sentence', () => {
    const two = [...SENTENCE, ...tokens(['本', '本', 'noun'])];
    expect(seq(s('いい'), gap(3), s('本'))(two, 5)).toEqual([]);
  });

  it('spells forms over whole tokens, however they were split', () => {
    expect(text('でもいい')(SENTENCE, 3)).toEqual([6]);
    expect(text('でもい')(SENTENCE, 3)).toEqual([6]);
    expect(text('でもよい')(SENTENCE, 3)).toEqual([]);
    expect(text('。。')(SENTENCE, 6)).toEqual([]);
  });
});

describe('detection', () => {
  it('finds the leftmost, longest span with text offsets', () => {
    expect(findSpan(ENTRY.rule, SENTENCE)).toEqual({ start: 3, end: 6 });
    expect(detectEntry(ENTRY, SENTENCE)).toEqual({
      id: 'te-mo-ii',
      start: 3,
      end: 6,
      from: 4,
      to: 8,
    });
  });

  it('ignores zero-width matches and empty sentences', () => {
    expect(findSpan(not(s('x')), SENTENCE)).toBeUndefined();
    expect(detectEntry(ENTRY, [])).toBeUndefined();
    expect(detectEntries([ENTRY], SENTENCE.slice(0, 3))).toEqual([]);
  });

  it('turns an entry into a grammar point', () => {
    expect(toGrammarPoint(ENTRY)).toEqual({
      id: 'te-mo-ii',
      pattern: '〜てもいい',
      meaning: 'may',
      level: ENTRY.level,
      exampleSentenceIds: [],
    });
  });
});
