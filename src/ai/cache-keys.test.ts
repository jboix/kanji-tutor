/** A15: answers are keyed on the smallest input that decides them, and peeking never calls. */
import { describe, expect, it } from 'vitest';
import {
  breakdownKey,
  breakdownSentence,
  explainMistake,
  explainWord,
  mistakeKey,
  wordKey,
} from './tasks.ts';
import { scriptedProvider, testContext } from './testing/context.ts';
import type { ExplainMistakeInput } from './types.ts';

const WORD_REPLY = JSON.stringify({
  surface: '間',
  reading: { surface: '間', reading: 'あいだ' },
  meaning: 'while',
  nuance: 'A span of time.',
  chips: [],
  readings: [],
});

const MISTAKE_REPLY = JSON.stringify({
  explanation: 'The vowel is long.',
  chips: [],
  readings: [],
});

const BREAKDOWN_REPLY = JSON.stringify({
  translation: 'I read a book while I waited.',
  chips: [],
  chunks: [
    { text: '待っている間に、', gloss: 'while waiting' },
    { text: '本を読みました。', gloss: 'I read a book' },
  ],
  readings: [],
});

const A = { text: '待っている間に、本を読みました。' };
const B = { text: '休みの間、家にいた。' };

describe('cache keys (A15)', () => {
  it('shares a word explanation across sentences', async () => {
    const provider = scriptedProvider([WORD_REPLY]);
    const context = testContext({ provider });
    const first = await explainWord({ sentence: A, surface: '間', wordId: '1' }, context);
    const second = await explainWord({ sentence: B, surface: '間', wordId: '1' }, context);
    expect(first).toMatchObject({ ok: true, cached: false });
    expect(second).toMatchObject({ ok: true, cached: true });
    expect(provider.requests).toHaveLength(1);
    expect(provider.requests[0]?.prompt).not.toContain('休み');
    expect(
      wordKey({ sentence: A, surface: '待って', word: { form: '待つ', meanings: [] } }),
    ).toEqual({
      form: '待つ',
    });
  });

  it('keys a named slip on the word, reading, type and confused kanji, not the answer', async () => {
    const provider = scriptedProvider([MISTAKE_REPLY]);
    const context = testContext({ provider });
    const base: ExplainMistakeInput = {
      sentence: A,
      target: { surface: '紹介', expected: 'しょうかい' },
      answer: 'しょかい',
      errorType: 'long-vowel',
    };
    await explainMistake(base, context);
    const again = await explainMistake({ ...base, answer: 'しょおかい', sentence: B }, context);
    expect(again).toMatchObject({ ok: true, cached: true });
    expect(provider.requests).toHaveLength(1);
    expect(mistakeKey(base)).toEqual({
      surface: '紹介',
      expected: 'しょうかい',
      errorType: 'long-vowel',
      confused: undefined,
    });
    const swapped = {
      ...base,
      errorType: 'wrong-kanji' as const,
      confused: { kanji: '待', lookalike: '持' },
    };
    expect(mistakeKey(swapped)).toMatchObject({ confused: { kanji: '待', lookalike: '持' } });
    const other = { ...base, errorType: 'other' as const };
    expect(mistakeKey(other)).toMatchObject({ answer: 'しょかい', sentence: A });
  });

  it('breaks a sentence down once, whichever word is tapped, marking the tapped chunk', async () => {
    const provider = scriptedProvider([BREAKDOWN_REPLY]);
    const context = testContext({ provider });
    const first = await breakdownSentence({ sentence: A, focus: '間に' }, context);
    const second = await breakdownSentence({ sentence: A, focus: '本' }, context);
    expect(provider.requests).toHaveLength(1);
    expect(first.ok && first.value.chunks.map((c) => c.focus)).toEqual([true, false]);
    expect(second.ok && second.value.chunks.map((c) => c.focus)).toEqual([false, true]);
    expect(second).toMatchObject({ cached: true });
    expect(breakdownKey({ sentence: A, focus: 'x' })).toEqual({
      sentence: A.text,
      translation: undefined,
    });
  });
});

describe('peek', () => {
  it('returns a cached answer and never calls the provider or logs', async () => {
    const provider = scriptedProvider([WORD_REPLY]);
    const context = testContext({ provider });
    const input = { sentence: A, surface: '間', wordId: '1' };
    expect(await explainWord.peek(input, context)).toBeUndefined();
    expect(provider.requests).toHaveLength(0);
    await explainWord(input, context);
    const logged = context.logEntries.length;
    expect(await explainWord.peek(input, context)).toMatchObject({ meaning: 'while' });
    expect(provider.requests).toHaveLength(1);
    expect(context.logEntries).toHaveLength(logged);
    expect(await explainWord.peek(input, testContext())).toBeUndefined();
  });
});

describe('cost log', () => {
  it('records the prompt tokens Gemini served from its implicit cache', async () => {
    const reply = { text: WORD_REPLY, inputTokens: 900, outputTokens: 50, cachedTokens: 600 };
    const context = testContext({ provider: scriptedProvider([reply]) });
    await explainWord({ sentence: A, surface: '間' }, context);
    expect(context.logEntries[0]).toMatchObject({
      inputTokens: 900,
      cachedTokens: 600,
      cached: false,
    });
    const plain = testContext({ provider: scriptedProvider([WORD_REPLY]) });
    await explainWord({ sentence: A, surface: '間' }, plain);
    expect(plain.logEntries[0]).not.toHaveProperty('cachedTokens');
  });
});
