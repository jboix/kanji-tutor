/** Fixture-like AI results for the explain tests (no AI is ever called). */
import type {
  Answer,
  FollowUpResult,
  MistakeExplanation,
  Result,
  SentenceBreakdown,
  WordExplanation,
} from '../ai/types.ts';
import type { SessionCard, Target } from '../domain/session-types.ts';
import type { Grade } from '../domain/types.ts';
import { S, W } from './reading-fixtures.ts';

export const ok = <T>(value: T): Promise<Result<T>> =>
  Promise.resolve({ ok: true, value, cached: false });

export const offline = <T>(): Promise<Result<T>> =>
  Promise.resolve({ ok: false, error: { kind: 'offline', message: 'You are offline.' } });

export const noKey = <T>(): Promise<Result<T>> =>
  Promise.resolve({ ok: false, error: { kind: 'no-key', message: 'Add a key.' } });

export const TARGET: Target = {
  tokenIndex: 4,
  itemId: `word:${W.matsu.id}`,
  wordId: W.matsu.id,
  surface: '待っ',
  readings: ['まっ', 'まって'],
};

export const CARD: SessionCard = { sentence: S.waiting, targets: [TARGET], reason: 'due' };

export const WRONG: Grade = {
  verdict: 'wrong',
  errorType: 'wrong-kanji',
  expected: 'まって',
  given: 'もって',
};

export const MISTAKE: MistakeExplanation = {
  explanation: 'You read it as 持, to hold. Look at the left side: 待 has 彳, while 持 has 扌.',
  confusedWith: { kanji: '持', meaning: 'to hold' },
  chips: [
    { kind: 'compare', label: '待 and 持 side by side' },
    { kind: 'example', label: 'One more with 待' },
    { kind: 'quiz', label: 'Quiz me' },
    { kind: 'simpler', label: 'Break down the sentence' },
  ],
  readings: [
    { surface: '待って', reading: 'まって', verified: true },
    { surface: '持って', reading: 'もって', verified: true },
  ],
};

export const COMPARE: FollowUpResult = {
  text: '待 has 彳 on the left; 持 has 扌, a hand.',
  readings: [{ surface: '待つ', reading: 'まつ', verified: true }],
};

export const QUIZ: FollowUpResult = {
  text: 'Pick the one that fits.',
  quiz: {
    question: '電車を待っている（　）、音楽を聞いていた。',
    options: ['間', '間に'],
    answerIndex: 0,
  },
  readings: [],
};

export const WORD: WordExplanation = {
  surface: '間',
  reading: { surface: '間', reading: 'あいだ', verified: true },
  meaning: 'while, at some point during',
  nuance: 'With 間に, the reading happened at some point while you waited.',
  contrast: { text: '待っている間、本を読んでいた。', meaning: 'I was reading the whole time.' },
  chips: [
    { kind: 'quiz', label: 'Quiz me: 間 or 間に?' },
    { kind: 'simpler', label: 'Simpler, please' },
    { kind: 'keep', label: 'Keep in my notes' },
  ],
  readings: [{ surface: '本', reading: 'ほん', verified: true }],
};

export const BREAKDOWN: SentenceBreakdown = {
  translation: 'While I was waiting for a friend at the station, I read a book.',
  chunks: [
    { text: '駅で', gloss: 'at the station', focus: false },
    { text: '間に', gloss: 'during that time', focus: true },
    { text: '、本を読みました。', gloss: 'I read a book', focus: false },
  ],
  readings: [{ surface: '駅', reading: 'えき', verified: true }],
};

export const ANSWER: Answer = {
  answer: '間に marks a point inside a stretch of time.',
  readings: [{ surface: '間', reading: 'あいだ', verified: true }],
};
