import { describe, expect, it } from 'vitest';
import { createMemoryRepos } from '../../test/memory-repos.ts';
import type { GrammarPoint, Item, Token } from '../types.ts';
import { type AcceptedCorrection, acceptComposition, usedLevel } from './compose.ts';

const NOW = Date.UTC(2026, 9, 18, 9, 0);
const GRAMMAR: GrammarPoint = {
  id: 'わけではない',
  pattern: '〜わけではない',
  meaning: "It's not that…",
  lesson: 'Tobira 第4課',
  exampleSentenceIds: ['old'],
};
const ORIGINAL = '日本語が嫌いわけではない。';
const CORRECTED = '日本語が嫌いなわけではない。';

function correction(overrides: Partial<AcceptedCorrection> = {}): AcceptedCorrection {
  return {
    corrected: CORRECTED,
    marks: [{ severity: 'error' }, { severity: 'style' }],
    usesTarget: true,
    readings: [{ verified: true }, { verified: true }],
    ...overrides,
  };
}

const TOKENS: Token[] = [
  { surface: '日本語', reading: 'にほんご', base: '日本語', pos: 'noun', wordId: '10', start: 0 },
  { surface: 'が', reading: 'が', base: 'が', pos: 'particle', start: 3 },
  { surface: '嫌い', reading: 'きらい', base: '嫌い', pos: 'noun', wordId: '20', start: 4 },
  { surface: '日本語', reading: 'にほんご', base: '日本語', pos: 'noun', wordId: '10', start: 0 },
];
const lang = { tokenize: async (_text: string) => TOKENS };

function grammarItem(level: Item['level'], card = false): Item {
  const item: Item = {
    id: 'grammar:わけではない',
    kind: 'grammar',
    ref: 'わけではない',
    level,
    source: { kind: 'manual', lesson: 'Tobira 第4課', week: '2026-W41', addedAt: 1 },
    updatedAt: 1,
  };
  if (card)
    item.card = {
      due: 5,
      stability: 1,
      difficulty: 5,
      elapsedDays: 0,
      scheduledDays: 0,
      learningSteps: 0,
      reps: 1,
      lapses: 0,
      state: 1,
    };
  return item;
}

describe('usedLevel', () => {
  it('maps errors to 3, clean use to 4, and never lowers', () => {
    expect(usedLevel(1, true)).toBe(3);
    expect(usedLevel(1, false)).toBe(4);
    expect(usedLevel(4, true)).toBe(4);
    expect(usedLevel(2, false)).toBe(4);
  });
});

describe('acceptComposition', () => {
  it('saves the corrected sentence as a verified compose sentence for the grammar point', async () => {
    const repos = createMemoryRepos();
    await repos.items.put(grammarItem(1));
    const input = {
      grammar: GRAMMAR,
      original: ORIGINAL,
      correction: correction(),
      now: NOW,
      lang,
    };
    const { sentence, item } = await acceptComposition(repos, input);
    expect(sentence).toMatchObject({
      text: CORRECTED,
      source: 'compose',
      sourceRef: 'grammar:わけではない',
      tokens: TOKENS,
      wordIds: ['10', '20'],
      grammarIds: ['わけではない'],
      verified: true,
    });
    expect(await repos.sentences.get(sentence.id)).toEqual(sentence);
    expect(item.level).toBe(3);
    expect(item.card?.due).toBe(NOW);
    expect(item.source.kind).toBe('manual');
    expect(await repos.items.get(item.id)).toEqual(item);
    expect((await repos.grammar.get(GRAMMAR.id))?.exampleSentenceIds).toEqual(['old', sentence.id]);
  });

  it('keeps an existing card and reaches level 4 without error marks', async () => {
    const repos = createMemoryRepos();
    await repos.items.put(grammarItem(2, true));
    const input = {
      grammar: GRAMMAR,
      original: ORIGINAL,
      correction: correction({ marks: [{ severity: 'style' }] }),
      now: NOW,
      lang,
    };
    const { item } = await acceptComposition(repos, input);
    expect(item.level).toBe(4);
    expect(item.card?.due).toBe(5);
  });

  it('marks the sentence unverified when a reading failed or it did not tokenize', async () => {
    const repos = createMemoryRepos();
    const unverified = correction({ readings: [{ verified: true }, { verified: false }] });
    const a = await acceptComposition(repos, {
      grammar: GRAMMAR,
      original: ORIGINAL,
      correction: unverified,
      now: NOW,
      lang,
    });
    expect(a.sentence.verified).toBe(false);
    const failing = { tokenize: async () => Promise.reject(new Error('no worker')) };
    const b = await acceptComposition(repos, {
      grammar: GRAMMAR,
      original: ORIGINAL,
      correction: correction(),
      now: NOW + 1,
      lang: failing,
    });
    expect(b.sentence).toMatchObject({ tokens: [], wordIds: [], verified: false });
    const c = await acceptComposition(repos, {
      grammar: GRAMMAR,
      original: ORIGINAL,
      correction: correction(),
      now: NOW + 2,
    });
    expect(c.sentence.verified).toBe(false);
    expect(new Set([a.sentence.id, b.sentence.id, c.sentence.id]).size).toBe(3);
  });

  it('creates a compose item when the grammar point had none', async () => {
    const repos = createMemoryRepos();
    const { item } = await acceptComposition(repos, {
      grammar: GRAMMAR,
      original: ORIGINAL,
      correction: correction(),
      now: NOW,
      lang,
    });
    expect(item).toMatchObject({
      kind: 'grammar',
      level: 3,
      source: { kind: 'compose', week: '2026-W42' },
    });
  });

  it('does not count a sentence that misses the target', async () => {
    const repos = createMemoryRepos();
    await repos.grammar.put(GRAMMAR);
    await repos.items.put(grammarItem(1));
    const { sentence, item } = await acceptComposition(repos, {
      grammar: GRAMMAR,
      original: '本を読む。',
      correction: correction({ corrected: '', usesTarget: false }),
      now: NOW,
      lang,
    });
    expect(sentence.text).toBe('本を読む。');
    expect(sentence.grammarIds).toEqual([]);
    expect(item.level).toBe(1);
    expect((await repos.grammar.get(GRAMMAR.id))?.exampleSentenceIds).toEqual(['old']);
  });
});
