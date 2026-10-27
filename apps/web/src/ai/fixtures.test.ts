import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { FIXTURES } from './fixtures/index.ts';
import { createMockProvider } from './providers/mock.ts';
import { parseReply } from './run.ts';
import { pageAnalysisSchema } from './schemas/analyse-page.ts';
import { answerSchema } from './schemas/answer-question.ts';
import { assessLevelSchema } from './schemas/assess-level.ts';
import { breakdownSchema } from './schemas/breakdown-sentence.ts';
import { correctionSchema } from './schemas/correct-sentence.ts';
import { kanjiCandidatesSchema } from './schemas/describe-kanji.ts';
import { explainMistakeSchema } from './schemas/explain-mistake.ts';
import { explainSentenceSchema } from './schemas/explain-sentence.ts';
import { explainWordSchema } from './schemas/explain-word.ts';
import { followUpSchema } from './schemas/follow-up.ts';
import { generatedSentencesSchema } from './schemas/generate-sentences.ts';
import { kanjiStorySchema } from './schemas/kanji-story.ts';
import { memoryHookSchema } from './schemas/memory-hook.ts';
import { paraphraseSchema } from './schemas/paraphrase-question.ts';
import { readSignSchema } from './schemas/read-sign.ts';
import { handwritingSchema } from './schemas/recognize-handwriting.ts';
import { transcriptionSchema } from './schemas/transcribe-reading.ts';
import { weeklyNotesSchema } from './schemas/weekly-notes.ts';
import * as tasks from './tasks.ts';
import { fakeVerifier, testContext } from './testing/context.ts';
import type { TaskName } from './types.ts';

const SCHEMAS: Record<TaskName, z.ZodType> = {
  explainMistake: explainMistakeSchema,
  explainWord: explainWordSchema,
  breakdownSentence: breakdownSchema,
  answerQuestion: answerSchema,
  followUp: followUpSchema,
  correctSentence: correctionSchema,
  analysePage: pageAnalysisSchema,
  transcribeReading: transcriptionSchema,
  weeklyNotes: weeklyNotesSchema,
  generateSentences: generatedSentencesSchema,
  describeKanji: kanjiCandidatesSchema,
  recognizeHandwriting: handwritingSchema,
  explainSentence: explainSentenceSchema,
  memoryHook: memoryHookSchema,
  kanjiStory: kanjiStorySchema,
  readSign: readSignSchema,
  paraphraseQuestion: paraphraseSchema,
  assessLevel: assessLevelSchema,
};

/** Readings the real verifier gets from the tokenizer (conjugations, compounds). */
const EXTRA = {
  待って: ['まって'],
  持って: ['もって'],
  待っている: ['まっている'],
  読んでいた: ['よんでいた'],
  読みました: ['よみました'],
  待ちました: ['まちました'],
  書きました: ['かきました'],
  先生: ['せんせい'],
  紹: ['しょう'],
  方言: ['ほうげん'],
};

const READ = { text: '駅で友達を待っている間に、本を読みました。', lesson: 'Tobira 第4課' };
const VOICE = { text: '先生に新しい友達を紹介しました。' };
const CAPTURE = { text: 'しかし、方言を話す人が減っているわけではない。' };
const IMAGE = { mime: 'image/jpeg', data: '/9j/4AAQ' };

function context() {
  return testContext({ provider: createMockProvider(), lang: fakeVerifier(EXTRA) });
}

async function value<T>(promise: Promise<{ ok: true; value: T } | { ok: false }>): Promise<T> {
  const result = await promise;
  if (!result.ok) throw new Error(`task failed: ${JSON.stringify(result)}`);
  return result.value;
}

describe('recorded fixtures', () => {
  it.each(Object.entries(FIXTURES))(
    'every %s fixture validates against its schema',
    (task, set) => {
      expect(set.fixtures.length).toBeGreaterThan(0);
      for (const fixture of set.fixtures) {
        const parsed = parseReply(SCHEMAS[task as TaskName], JSON.stringify(fixture.response));
        expect(parsed.ok, `${task} ${fixture.match ?? 'default'}`).toBe(true);
        expect(fixture.inputTokens).toBeGreaterThan(0);
        expect(fixture.outputTokens).toBeGreaterThan(0);
      }
    },
  );

  it('contain no praise, exclamations or gamified wording', () => {
    const text = JSON.stringify(FIXTURES);
    expect(text).not.toMatch(/!|great job|well done|amazing|excellent|streak|points|badge|\bxp\b/i);
  });
});

describe('tasks over the mock provider', () => {
  it('explainMistake: 待 read as 持 (read.html)', async () => {
    const input = {
      sentence: READ,
      target: { surface: '待って', expected: 'まって' },
      answer: 'もって',
    };
    const result = await value(tasks.explainMistake(input, context()));
    expect(result.confusedWith).toEqual({ kanji: '持', meaning: 'to hold' });
    expect(result.chips.map((chip) => chip.label)).toEqual([
      '待 and 持 side by side',
      'One more with 待',
      'Break down the sentence',
    ]);
    expect(result).toMatchSnapshot();
  });

  it('explainMistake: しょかい for 紹介 (voice.html) keeps しょうかい verified', async () => {
    const input = {
      sentence: VOICE,
      target: { surface: '紹介', expected: 'しょうかい' },
      answer: 'しょかい',
    };
    const result = await value(tasks.explainMistake(input, context()));
    expect(result.explanation).toContain('short vowel');
    expect(result.readings).toContainEqual({
      surface: '紹介',
      reading: 'しょうかい',
      verified: true,
    });
  });

  it('explainMistake: 一生 hook from 一緒 (kanji.html)', async () => {
    const input = {
      sentence: { text: '一生忘れません。' },
      target: { surface: '一生', expected: 'いっしょう' },
      answer: 'いっしょ',
    };
    const result = await value(tasks.explainMistake(input, context()));
    expect(result.hook).toContain('一緒');
    expect(result.readings.every((reading) => reading.verified)).toBe(true);
  });

  it('explainWord: 間に breakdown chips (explain.html)', async () => {
    const result = await value(tasks.explainWord({ sentence: READ, surface: '間に' }, context()));
    expect(result.reading).toEqual({ surface: '間に', reading: 'あいだに', verified: false });
    expect(result.chips.map((chip) => chip.label)).toEqual([
      'Quiz me: 間 or 間に?',
      'Simpler, please',
      'Keep in my notes',
    ]);
    expect(result).toMatchSnapshot();
  });

  it('explainWord: にっぽんじん is verified and names にほんじん as the usual reading (R10)', async () => {
    const sentence = { text: '友達は日本人です。' };
    const result = await value(tasks.explainWord({ sentence, surface: '日本人' }, context()));
    const nippon = {
      surface: '日本人',
      reading: 'にっぽんじん',
      verified: true,
      preferred: 'にほんじん',
    };
    expect(result.reading).toEqual(nippon);
    expect(result.readings).toContainEqual(nippon);
  });

  it('explainWord: a claimed 紹介=しょかい ends up unverified', async () => {
    const result = await value(tasks.explainWord({ sentence: VOICE, surface: '紹介' }, context()));
    expect(result.reading).toEqual({ surface: '紹介', reading: 'しょかい', verified: false });
    expect(result.readings).toContainEqual({
      surface: '紹介',
      reading: 'しょかい',
      verified: false,
    });
    expect(result.readings).toContainEqual({
      surface: '友達',
      reading: 'ともだち',
      verified: true,
    });
  });

  it('explainWord: わけではない from a capture', async () => {
    const input = { sentence: CAPTURE, surface: 'わけではない' };
    expect(await value(tasks.explainWord(input, context()))).toMatchSnapshot();
  });

  it('breakdownSentence: chunks join back into the sentence', async () => {
    const result = await value(
      tasks.breakdownSentence({ sentence: READ, focus: '間に' }, context()),
    );
    expect(result.chunks.map((chunk) => chunk.text).join('')).toBe(READ.text);
    expect(result.chunks.find((chunk) => chunk.focus)?.text).toBe('間に');
    const line = await value(tasks.breakdownSentence({ sentence: CAPTURE }, context()));
    expect(line.chunks.map((chunk) => chunk.text).join('')).toBe(CAPTURE.text);
    expect([result, line]).toMatchSnapshot();
  });

  it('answerQuestion: default and わけではない', async () => {
    const asked = { scope: 'sentence' as const, question: 'Why に?' };
    const read = await value(tasks.answerQuestion({ ...asked, sentence: READ }, context()));
    const input = { ...asked, sentence: CAPTURE, surface: 'わけではない' };
    const capture = await value(tasks.answerQuestion(input, context()));
    expect(capture.answer).toContain('pushing back');
    expect([read, capture]).toMatchSnapshot();
  });

  it.each([
    ['compare', 'text'],
    ['example', 'example'],
    ['simpler', 'text'],
    ['quiz', 'quiz'],
  ] as const)('followUp %s', async (kind, field) => {
    const input = { kind, sentence: READ, surface: '待って', previous: 'You read it as 持.' };
    const result = await value(tasks.followUp(input, context()));
    expect(result[field]).toBeDefined();
    expect(result).toMatchSnapshot();
  });

  it('correctSentence: な insertion (error) and 好きではない (style)', async () => {
    const sentence = '日本語が嫌いわけではないが、漢字を書くのは好きじゃない。';
    const input = { grammar: { pattern: '〜わけではない', meaning: "it's not that…" }, sentence };
    const result = await value(tasks.correctSentence(input, context()));
    const [insert, style] = result.marks;
    expect(insert).toMatchObject({ kind: 'insert', severity: 'error', text: 'な' });
    expect(sentence.slice(0, insert?.start)).toBe('日本語が嫌い');
    expect(style && sentence.slice(style.start, style.end)).toBe('好きじゃない');
    expect(result).toMatchObject({
      verdict: 'needs-work',
      works: expect.stringMatching(/^わけではない/),
    });
    expect(result).toMatchSnapshot();
  });

  it('correctSentence: "Use は instead of が" lands on が, though the offsets were one off', async () => {
    const sentence = '私が犬はあまり好きじゃない';
    const input = { grammar: { pattern: '〜じゃない', meaning: 'is not' }, sentence };
    const result = await value(tasks.correctSentence(input, context()));
    const spans = result.marks.map((m) => [m.start, sentence.slice(m.start, m.end), m.text]);
    expect(spans).toEqual([
      [1, 'が', 'は'],
      [3, 'は', 'が'],
    ]);
    expect(result.marks[0]?.title).toBe('Use は instead of が.');
  });

  it('correctSentence: drops marks whose offsets do not fit a shorter sentence', async () => {
    const input = { grammar: { pattern: '〜わけではない', meaning: '' }, sentence: '短い。' };
    expect((await value(tasks.correctSentence(input, context()))).marks).toEqual([]);
  });

  it('transcribeReading: しょかい stays しょかい', async () => {
    const result = await tasks.transcribeReading(
      { audio: { mime: 'audio/webm', data: 'GkXf' } },
      context(),
    );
    expect(result).toEqual({ ok: true, cached: false, value: { kana: 'しょかい' } });
  });

  it('weeklyNotes: letter and plan (notes.html)', async () => {
    const stats = {
      week: '11–17 October',
      sentencesRead: 212,
      correct: 186,
      byErrorType: { 'long-vowel': 7 },
      missExamples: [{ surface: '紹介', expected: 'しょうかい', given: 'しょかい' }],
      unusedGrammar: ['〜わけではない', '〜に対して'],
    };
    const result = await value(tasks.weeklyNotes({ stats }, context()));
    expect(result.plan.map((line) => line.when)).toEqual(['Daily', 'Tue, Thu']);
    expect(result).toMatchSnapshot();
  });

  it('generateSentences: keeps sentences whose readings all verify', async () => {
    const input = {
      targets: [{ surface: '待つ', reading: 'まつ', meaning: 'to wait' }],
      knownWords: ['駅', '友達'],
      count: 3,
    };
    const result = await value(tasks.generateSentences(input, context()));
    expect(result.sentences).toHaveLength(3);
    const strict = testContext({ provider: createMockProvider() });
    const dropped = await value(tasks.generateSentences(input, strict));
    expect(dropped.sentences).toEqual([]);
    expect(dropped.readings.filter((reading) => !reading.verified).length).toBeGreaterThan(0);
  });

  it('describeKanji and recognizeHandwriting: 待 first (handwrite.html)', async () => {
    const described = await value(
      tasks.describeKanji({ description: 'temple on the right, means wait' }, context()),
    );
    const drawn = await value(tasks.recognizeHandwriting({ image: IMAGE }, context()));
    expect(described.candidates[0]?.char).toBe('待');
    expect(drawn.candidates).toEqual(['待', '持', '特', '時', '詩']);
  });
});
