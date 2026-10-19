import { describe, expect, it } from 'vitest';
import type { KnownCheck } from '../domain/learner-view.ts';
import type { Token } from '../domain/types.ts';
import {
  aboveLearner,
  checkImmersion,
  classifyTokens,
  glossPlaces,
  isContentToken,
  shouldFallBack,
} from './immersion-check.ts';
import { fakeLearner, fakeVerifier } from './testing/context.ts';

/** A token; `start` does not matter to the post-check. */
const tok = (surface: string, reading: string, pos = 'noun', base = surface): Token => ({
  surface,
  reading,
  base,
  pos,
  start: 0,
});

/** Tokens in order, each `start` after the one before, as the tokenizer gives them. */
function laid(tokens: Token[]): Token[] {
  let start = 0;
  return tokens.map((token) => {
    const placed = { ...token, start };
    start += token.surface.length;
    return placed;
  });
}

const TOKENS: Record<string, Token[]> = {
  '駅で影響を待つ。': laid([
    tok('駅', 'えき'),
    tok('で', 'で', 'particle'),
    tok('影響', 'えいきょう'),
    tok('を', 'を', 'particle'),
    tok('待つ', 'まつ', 'verb'),
    tok('。', '', 'symbol'),
  ]),
};

/** Known: 駅 and 待つ; 影響 is an N3 word never met. */
const STATES: Record<string, Omit<KnownCheck, 'kind' | 'text' | 'found'>> = {
  駅: { state: 'known', jlpt: 5 },
  待つ: { state: 'known', jlpt: 5 },
  影響: { state: 'unseen', jlpt: 3 },
  // Learning and at the level: not glossed.
  先生: { state: 'learning', jlpt: 5 },
  // Learning but harder than the level: glossed.
  方言: { state: 'learning', jlpt: 2 },
};

function deps(extra: Record<string, string[]> = {}) {
  const learner = fakeLearner({
    checkKnown: async (query) =>
      (query.words ?? []).map((text) => ({
        kind: 'word',
        text,
        found: text in STATES,
        ...(STATES[text] ?? { state: 'unseen' }),
      })),
    lookupWord: async (text) =>
      text === '影響'
        ? [
            {
              forms: ['影響'],
              readings: ['えいきょう'],
              meanings: ['influence'],
              common: true,
              state: 'unseen',
            },
          ]
        : [],
  });
  const lang = {
    ...fakeVerifier({ 影響: ['えいきょう'], ...extra }),
    tokenize: async (text: string) => TOKENS[text] ?? [],
  };
  return { lang, learner };
}

const PLAN = { mode: 'japanese', level: 4 } as const;

describe('content words and the learner (M2)', () => {
  it('counts kanji words that are not particles, auxiliaries or symbols', () => {
    expect(isContentToken(tok('駅', 'えき'))).toBe(true);
    expect(isContentToken(tok('で', 'で', 'particle'))).toBe(false);
    expect(isContentToken(tok('ある', 'ある', 'verb'))).toBe(false);
  });

  it('puts above the learner what is unseen, or learning and harder than their level', () => {
    expect(aboveLearner(undefined, 4)).toBe(true);
    expect(aboveLearner({ state: 'unseen', jlpt: 5 }, 4)).toBe(true);
    expect(aboveLearner({ state: 'known', jlpt: 1 }, 4)).toBe(false);
    expect(aboveLearner({ state: 'learning', jlpt: 4 }, 4)).toBe(false);
    expect(aboveLearner({ state: 'learning', jlpt: 3 }, 4)).toBe(true);
    expect(aboveLearner({ state: 'learning' }, 4)).toBe(true);
  });

  it('lists each word above the learner once, and counts every occurrence', () => {
    const tokens = [tok('影響', 'えいきょう'), tok('駅', 'えき'), tok('影響', 'えいきょう')];
    const states = new Map([['駅', { state: 'known' as const }]]);
    const result = classifyTokens(tokens, states, 4);
    expect(result).toMatchObject({ content: 3, aboveCount: 2 });
    expect(result.above.map((t) => t.surface)).toEqual(['影響']);
  });

  it('falls back above 15% of content words', () => {
    expect(shouldFallBack(1, 7)).toBe(false);
    expect(shouldFallBack(3, 20)).toBe(false);
    expect(shouldFallBack(4, 20)).toBe(true);
    expect(shouldFallBack(0, 0)).toBe(false);
  });
});

describe('checkImmersion (M2)', () => {
  it('gives an unknown word verified furigana and a gloss, and known words nothing', async () => {
    const note = await checkImmersion(['駅で影響を待つ。'], PLAN, deps(), { hidden: [] });
    expect(note.checked).toBe(true);
    expect(note.words).toEqual([
      { surface: '影響', reading: 'えいきょう', verified: true, gloss: 'influence' },
    ]);
    expect(note.unknownShare).toBeCloseTo(1 / 3);
    expect(note.texts).toEqual(['駅で影響を待つ。']);
    expect(note.places).toEqual([{ text: 0, start: 2, end: 4, word: 0 }]);
  });

  it('places furigana by token offsets, never inside another word (Issue 34)', async () => {
    const tokens = [
      { surface: '毎日', reading: 'まいにち', base: '毎日', pos: 'noun', start: 0 },
      { surface: '日', reading: 'ひ', base: '日', pos: 'noun', start: 2 },
    ];
    const words = [{ surface: '日', reading: 'ひ', verified: true }];
    expect(glossPlaces(['毎日日'], [tokens], words)).toEqual([
      { text: 0, start: 2, end: 3, word: 0 },
    ]);
    // An offset that does not match the text is dropped rather than guessed.
    expect(glossPlaces(['毎日。'], [tokens], words)).toEqual([]);
  });

  it('falls back to mixed when too much is above the learner, keeping the summary', async () => {
    const summary = 'You wait for the influence at the station.';
    const note = await checkImmersion(['駅で影響を待つ。'], PLAN, deps(), { hidden: [], summary });
    expect(note.fellBack).toBe(true);
    expect(note.summaryNative).toBe(summary);
  });

  it('marks a reading the dictionary does not confirm as unverified', async () => {
    const note = await checkImmersion(['駅で影響を待つ。'], PLAN, deps({ 影響: ['えいこう'] }), {
      hidden: [],
    });
    expect(note.words[0]).toMatchObject({ surface: '影響', verified: false });
  });

  it('never adds furigana that gives away a hidden target, and redacts the summary', async () => {
    const hidden = [{ surface: '影響', readings: ['えいきょう'] }];
    const summary = '影響 (えいきょう) means influence.';
    const note = await checkImmersion(['駅で影響を待つ。'], PLAN, deps(), { hidden, summary });
    expect(note.words).toEqual([{ surface: '影響', verified: false, gloss: 'influence' }]);
    expect(note.summaryNative).not.toContain('えいきょう');
  });

  it('is unchecked without a tokenizer or a learner view', async () => {
    const { learner } = deps();
    const note = await checkImmersion(
      ['駅'],
      PLAN,
      { lang: fakeVerifier(), learner },
      {
        hidden: [],
        summary: 'At the station.',
      },
    );
    expect(note).toEqual({
      mode: 'japanese',
      words: [],
      unknownShare: 0,
      fellBack: false,
      checked: false,
      summaryNative: 'At the station.',
    });
  });

  it('is unchecked, not thrown, when the tokenizer fails', async () => {
    const { learner } = deps();
    const lang = {
      ...fakeVerifier(),
      tokenize: async () => Promise.reject(new Error('worker gone')),
    };
    const note = await checkImmersion(['駅'], PLAN, { lang, learner }, { hidden: [] });
    expect(note.checked).toBe(false);
  });
});
