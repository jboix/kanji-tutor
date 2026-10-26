import { describe, expect, it } from 'vitest';
import type { Prompt } from '../task-def.ts';
import type { LearnerProfile } from '../types.ts';
import { analysePagePrompt } from './analyse-page.ts';
import { answerQuestionPrompt } from './answer-question.ts';
import { breakdownSentencePrompt } from './breakdown-sentence.ts';
import { correctSentencePrompt } from './correct-sentence.ts';
import { describeKanjiPrompt } from './describe-kanji.ts';
import { explainMistakePrompt } from './explain-mistake.ts';
import { explainSentencePrompt } from './explain-sentence.ts';
import { explainWordPrompt } from './explain-word.ts';
import { followUpPrompt } from './follow-up.ts';
import { generateSentencesPrompt } from './generate-sentences.ts';
import { memoryHookPrompt } from './memory-hook.ts';
import { paraphraseQuestionPrompt } from './paraphrase-question.ts';
import { recognizeHandwritingPrompt } from './recognize-handwriting.ts';
import { transcribeReadingPrompt } from './transcribe-reading.ts';
import { weeklyNotesPrompt } from './weekly-notes.ts';

const PROFILE: LearnerProfile = {
  knownWords: ['一緒', '駅', '友達'],
  recentErrors: ['long-vowel', 'long-vowel', 'wrong-kanji'],
  currentLesson: 'Tobira 第4課',
};
const SENTENCE = {
  text: '駅で友達を待っている間に、本を読みました。',
  translation: 'While…',
  lesson: '第4課',
};
const MEDIA = { mime: 'image/jpeg', data: 'AAAA' };

const BUILT: [string, Prompt<never>, unknown][] = [
  [
    'explainMistake',
    explainMistakePrompt,
    {
      sentence: SENTENCE,
      target: { surface: '待って', expected: 'まって' },
      answer: 'もって',
      errorType: 'wrong-kanji',
    },
  ],
  ['explainWord', explainWordPrompt, { sentence: SENTENCE, surface: '間に' }],
  ['breakdownSentence', breakdownSentencePrompt, { sentence: SENTENCE, focus: '間に' }],
  [
    'answerQuestion',
    answerQuestionPrompt,
    {
      scope: 'word',
      sentence: SENTENCE,
      surface: '間に',
      question: 'Why に?',
    },
  ],
  [
    'followUp',
    followUpPrompt,
    { kind: 'quiz', sentence: SENTENCE, surface: '間に', previous: 'P' },
  ],
  [
    'correctSentence',
    correctSentencePrompt,
    {
      grammar: { pattern: '〜わけではない', meaning: "it's not that…" },
      sentence: '日本語が嫌いわけではない。',
    },
  ],
  ['analysePage', analysePagePrompt, { image: MEDIA, page: 2, pages: 3 }],
  ['transcribeReading', transcribeReadingPrompt, { audio: MEDIA }],
  [
    'weeklyNotes',
    weeklyNotesPrompt,
    {
      stats: {
        week: '11–17 October',
        sentencesRead: 212,
        correct: 186,
        byErrorType: {},
        missExamples: [],
        unusedGrammar: [],
      },
    },
  ],
  [
    'generateSentences',
    generateSentencesPrompt,
    {
      targets: [{ surface: '待つ', reading: 'まつ', meaning: 'to wait' }],
      knownWords: ['駅'],
      count: 2,
    },
  ],
  ['describeKanji', describeKanjiPrompt, { description: 'temple on the right' }],
  ['recognizeHandwriting', recognizeHandwritingPrompt, { image: MEDIA }],
  [
    'explainSentence',
    explainSentencePrompt,
    {
      sentence: SENTENCE,
      grammar: [{ pattern: '〜ている', meaning: 'ongoing action' }],
      hidden: [{ surface: '待って', readings: ['まって', 'まつ'] }],
    },
  ],
  [
    'memoryHook',
    memoryHookPrompt,
    {
      word: { surface: '待つ', reading: 'まつ', meaning: 'to wait' },
      kanji: [
        {
          char: '待',
          meanings: ['wait'],
          parts: [{ char: '彳' }, { char: '寺', meaning: 'temple' }],
        },
      ],
      sentence: SENTENCE,
    },
  ],
  [
    'paraphraseQuestion',
    paraphraseQuestionPrompt,
    { sentence: SENTENCE, phrase: '待っている間に' },
  ],
];

describe('prompts', () => {
  it.each(BUILT)('%s is versioned, calm and asks for JSON', (_name, prompt, input) => {
    expect(Number.isInteger(prompt.version) && prompt.version > 0).toBe(true);
    expect(prompt.system).toMatch(/JSON only/);
    expect(prompt.build(input as never, PROFILE)).toMatchSnapshot();
  });

  it('forbids praise and gamified wording in every tutor prompt', () => {
    const tutor = BUILT.filter(([, prompt]) => prompt.system.startsWith('You are a calm'));
    expect(tutor).toHaveLength(11);
    for (const [, prompt] of tutor) expect(prompt.system).toContain('No praise, cheering');
  });

  it('puts the target first so the mock can match it', () => {
    const built = explainWordPrompt.build({ sentence: SENTENCE, surface: '間に' }, PROFILE);
    expect(built.split('\n')[0]).toBe('Target: 間に');
  });

  it('carries the grammar point and the earlier turns of a conversation', () => {
    const built = answerQuestionPrompt.build(
      {
        scope: 'sentence',
        sentence: SENTENCE,
        question: 'And in casual speech?',
        grammar: { pattern: '〜ました', meaning: 'polite past' },
        history: [{ question: 'Why は?', answer: 'It sets\nthe topic.' }],
      },
      PROFILE,
    );
    expect(built).toContain('Grammar: 〜ました (polite past)');
    expect(built).toContain(
      'Earlier in this conversation:\nLearner: Why は?\nTutor: It sets the topic.',
    );
  });

  it('sends a general question from the Tutor tab without a sentence', () => {
    const built = answerQuestionPrompt.build(
      { scope: 'general', sentence: { text: '' }, question: 'は or が?' },
      { knownWords: [], recentErrors: [] },
    );
    expect(built).toBe('Question (general): は or が?');
  });

  it('every prompt that returns Japanese text asks for its readings', () => {
    const withReadings = [explainMistakePrompt, explainWordPrompt, breakdownSentencePrompt];
    for (const prompt of [...withReadings, answerQuestionPrompt, followUpPrompt]) {
      expect(prompt.system).toContain('"readings"');
    }
    expect(correctSentencePrompt.system).toContain('"readings"');
    expect(generateSentencesPrompt.system).toContain('"readings"');
    expect(explainSentencePrompt.system).toContain('"readings"');
    expect(memoryHookPrompt.system).toContain('"readings"');
    expect(paraphraseQuestionPrompt.system).toContain('"readings"');
  });

  it('demands hiragana as pronounced for spoken readings', () => {
    expect(transcribeReadingPrompt.system).toContain('しょかい, write しょかい');
    expect(transcribeReadingPrompt.system).toMatch(/never correct/i);
  });

  it('leaves out empty profile parts', () => {
    const built = explainWordPrompt.build(
      { sentence: { text: '本' }, surface: '本' },
      { knownWords: [], recentErrors: [] },
    );
    expect(built).toBe('Target: 本');
  });

  it('sends only what the cache key holds (A15)', () => {
    const word = explainWordPrompt.build(
      {
        sentence: SENTENCE,
        surface: '間に',
        word: { form: '間', reading: 'あいだ', meanings: ['space'] },
      },
      PROFILE,
    );
    expect(word).toContain('Target: 間 (あいだ)\nDictionary meanings: space');
    expect(word).not.toContain(SENTENCE.text);
    const target = { surface: '待って', expected: 'まって' };
    const named = explainMistakePrompt.build(
      {
        sentence: SENTENCE,
        target,
        answer: 'もって',
        errorType: 'wrong-kanji',
        confused: { kanji: '待', lookalike: '持' },
      },
      PROFILE,
    );
    expect(named).toContain('Confused kanji: 待 read as 持');
    expect(named).not.toContain('もって');
    expect(named).not.toContain(SENTENCE.text);
    const other = explainMistakePrompt.build(
      { sentence: SENTENCE, target, answer: 'ほげ', errorType: 'other' },
      PROFILE,
    );
    expect(other).toContain('Learner answered: ほげ');
    expect(other).toContain(SENTENCE.text);
    const breakdown = breakdownSentencePrompt.build({ sentence: SENTENCE, focus: '間に' }, PROFILE);
    expect(breakdown).not.toContain('Target');
    expect(breakdown).not.toContain('From: ');
  });
});
