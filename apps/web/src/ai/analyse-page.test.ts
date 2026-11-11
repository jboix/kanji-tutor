import { describe, expect, it } from 'vitest';
import { createMockProvider } from './providers/mock.ts';
import { parseReply } from './run.ts';
import { finalizePageAnalysis, pageAnalysisSchema } from './schemas/analyse-page.ts';
import * as tasks from './tasks.ts';
import { fakeVerifier, testContext } from './testing/context.ts';
import type { PageAnalysis } from './types.ts';

const IMAGE = { mime: 'image/jpeg', data: '/9j/4AAQ' };

/** Readings the real verifier confirms through the dictionary and the tokenizer. */
const KNOWN = {
  天気予報: ['てんきよほう'],
  晴れ: ['はれ'],
  曇り: ['くもり'],
  台風: ['たいふう'],
  天気: ['てんき'],
  予報: ['よほう'],
};

function context(lang = fakeVerifier(KNOWN)) {
  return testContext({ provider: createMockProvider(), lang });
}

async function page(n: number, pages = 6, lang = fakeVerifier(KNOWN)): Promise<PageAnalysis> {
  const result = await tasks.analysePage({ image: IMAGE, page: n, pages }, context(lang));
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result.value;
}

describe('analysePage over the mock provider', () => {
  it('tells the six page kinds apart', async () => {
    const kinds = await Promise.all([1, 2, 3, 4, 5, 6].map(async (n) => (await page(n)).kind));
    expect(kinds).toEqual(['kanji-list', 'grammar', 'handout', 'word-list', 'reading', 'mixed']);
  });

  it('keeps the lines in order with the unsure ones marked, and a suggested title', async () => {
    const kanji = await page(1);
    expect(kanji.title).toBe('Weather and plans');
    expect(kanji.lines.filter((line) => line.unsure).map((line) => line.text)).toEqual([
      '曇　くも（る）　ドン',
    ]);
    expect(kanji.kanji.map((k) => k.char)).toEqual(['雨', '晴', '雪', '曇', '風']);
  });

  it('checks every word reading: a word no dictionary confirms stays unverified', async () => {
    const { words } = await page(1);
    expect(words.find((w) => w.written === '天気予報')?.reading.verified).toBe(true);
    expect(words.find((w) => w.written === '雪見日和')?.reading).toEqual({
      surface: '雪見日和',
      reading: 'ゆきみびより',
      verified: false,
    });
  });

  it('answers every handout question, checking reading answers', async () => {
    const { questions } = await page(3);
    expect(questions.map((q) => q.type)).toEqual([
      'choose-form',
      'choose-form',
      'particle',
      'particle',
      'reading',
      'write-kanji',
      'reorder',
      'free',
    ]);
    const reading = questions.find((q) => q.type === 'reading');
    expect(reading).toMatchObject({ target: '天気予報', answer: 'てんきよほう' });
    expect(reading?.answerVerified).toBe(true);
    expect(questions.find((q) => q.type === 'write-kanji')?.answerVerified).toBe(true);
    expect(reading?.readings.map((r) => r.surface)).toEqual(['天気', '予報']);
    expect(questions.every((q) => q.answer !== '' && q.explanation !== '')).toBe(true);
  });

  it('marks a reading answer the verifier does not confirm', async () => {
    const { questions } = await page(3, 3, fakeVerifier({ 天気予報: ['てんきよほ'] }));
    expect(questions.find((q) => q.type === 'reading')?.answerVerified).toBe(false);
  });

  it('drops lines without Japanese', async () => {
    const reply = {
      kind: 'reading',
      title: 'T',
      blocks: [
        { kind: 'text', lines: [{ text: ' 12 ', unsure: false }], questions: [] },
        { kind: 'instruction', lines: [{ text: ' 雨です。 ', unsure: false }], questions: [] },
        // An exercise with no question is only its printed lines.
        { kind: 'exercise', lines: [{ text: '晴れです。', unsure: true }], questions: [] },
        // What cannot be imported keeps every printed line, Japanese or not.
        { kind: 'unsupported', lines: [{ text: '①＿＿　②＿＿', unsure: false }], questions: [] },
      ],
      kanji: [],
      words: [],
      grammar: [],
      readings: [],
    };
    const parsed = parseReply(pageAnalysisSchema, JSON.stringify(reply));
    if (!parsed.ok) throw new Error('did not parse');
    const done = await finalizePageAnalysis(parsed.value, undefined, fakeVerifier());
    expect(done.blocks).toEqual([
      { kind: 'instruction' },
      { kind: 'text' },
      { kind: 'unsupported' },
    ]);
    expect(done.lines).toEqual([
      { text: '雨です。', unsure: false, role: 'instruction', block: 0 },
      { text: '晴れです。', unsure: true, role: 'content', block: 1 },
      { text: '①＿＿　②＿＿', unsure: false, role: 'content', block: 2 },
    ]);
  });

  it('gives a handout in its printed order: instruction, exercise, and what cannot be imported', async () => {
    const { blocks, lines, questions } = await page(3);
    expect(blocks.slice(0, 6).map((block) => block.kind)).toEqual([
      'instruction',
      'exercise',
      'instruction',
      'exercise',
      'instruction',
      'unsupported',
    ]);
    expect(blocks[5]?.reason).toMatch(/pictures/);
    expect(blocks.filter((block) => block.kind === 'unsupported')).toHaveLength(2);
    expect(lines.filter((line) => line.block === 5).map((line) => line.text)).toEqual([
      '①＿＿＿＿　②＿＿＿＿　③＿＿＿＿',
    ]);
    expect(questions.map((question) => question.block)).toEqual([1, 1, 3, 3, 7, 9, 11, 14]);
    expect(lines.filter((line) => line.role === 'instruction')).toHaveLength(7);
  });

  it('rejects an unknown page kind', () => {
    const reply = { kind: 'poster', title: '', blocks: [], kanji: [], words: [], grammar: [] };
    expect(parseReply(pageAnalysisSchema, JSON.stringify(reply)).ok).toBe(false);
  });
});
