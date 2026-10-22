import { describe, expect, it } from 'vitest';
import { GRAMMAR_CATALOGUE } from '../../domain/grammar/index.ts';
import { PART_MEANINGS, plainMeaning, plainMeanings } from '../../domain/radicals.ts';
import { S } from '../../test/reading-fixtures.ts';
import { ENGLISH } from '../../ui/i18n/load.ts';
import { es } from '../../ui/i18n/messages/es/index.ts';
import { createTranslator } from '../../ui/i18n/translate.ts';
import { hardestGrammar, sentenceGrammar } from './grammar-line.ts';
import { partsHook, wordHooks } from './parts-hook.ts';
import { partOfSpeech } from './pos.ts';
import { whyHere } from './word-teaching.ts';

const t = createTranslator('en', ENGLISH, ENGLISH);

describe('parts hook (L1, no AI)', () => {
  it('builds 待 from 彳 and 寺', () => {
    const hook = partsHook(t, {
      char: '待',
      meaning: 'wait',
      parts: [
        { char: '彳', meaning: 'going' },
        { char: '寺', meaning: 'Buddhist temple' },
      ],
    });
    expect(hook).toBe(
      '待 = 彳 (going) + 寺 (Buddhist temple): picture going and Buddhist temple together to remember "wait".',
    );
  });

  it('works from one named part and says nothing without one', () => {
    const one = partsHook(t, {
      char: '時',
      meaning: 'time',
      parts: [{ char: '日', meaning: 'day' }, { char: '寺' }],
    });
    expect(one).toBe('時 = 日 (day) + 寺: let day remind you of "time".');
    expect(partsHook(t, { char: '生', meaning: 'life', parts: [] })).toBeUndefined();
    expect(partsHook(t, { char: '待', parts: [{ char: '彳', meaning: 'going' }] })).toBeUndefined();
  });

  it('adds a compound line for words of two kanji, and keeps at most three lines', () => {
    const kanji = [
      { char: '紹', meaning: 'introduce', parts: [{ char: '糸', meaning: 'thread' }] },
      { char: '介', meaning: 'jammed in', parts: [{ char: 'ハ', meaning: 'eight' }] },
    ];
    const hooks = wordHooks(t, '紹介', 'introduction', kanji);
    expect(hooks[0]).toBe('紹介 = 紹 (introduce) + 介 (jammed in) → "introduction".');
    expect(hooks).toHaveLength(3);
    expect(hooks.join(' ')).not.toMatch(/[ぁ-ん]/u);
  });
});

describe('dictionary labels', () => {
  it('names parts of speech and radicals', () => {
    expect(partOfSpeech(t, ['v5t', 'vt'])).toBe('godan verb · transitive verb');
    expect(partOfSpeech(t, ['n', 'vs'])).toBe('noun · noun that takes する');
    expect(partOfSpeech(t, ['zzz'])).toBeUndefined();
    expect(partOfSpeech(t, undefined)).toBeUndefined();
    expect(PART_MEANINGS.彳).toBe('going');
    expect(plainMeaning('one radical (no.1)')).toBe('one');
    expect(plainMeaning('')).toBeUndefined();
    expect(plainMeanings(['one', 'one radical (no.1)', 'single', 'a', 'b'])).toEqual([
      'one',
      'single',
      'a',
    ]);
  });
});

describe('why it is here (L1)', () => {
  const card = { reason: 'new' as const, targets: [{} as never] };
  const lesson = { source: { kind: 'textbook', week: 'w', addedAt: 0, lesson: 'Tobira 第4課' } };

  it('compares the JLPT level with the learner level', () => {
    expect(whyHere(t, { jlpt: 4 }, undefined, card, 4)[0]).toBe(
      'New at your level: a JLPT N4 word.',
    );
    expect(whyHere(t, { jlpt: 5 }, undefined, card, 4)[0]).toBe(
      'A JLPT N5 word, below your level.',
    );
    expect(whyHere(t, { jlpt: 3 }, undefined, card, 4)[0]).toBe(
      'A JLPT N3 word, above your N4 level.',
    );
    expect(whyHere(t, {}, undefined, card, 5)[0]).toBe(
      'New at your level (N5); it has no JLPT tag.',
    );
  });

  it('adds the lesson and the reason for the sentence', () => {
    const why = whyHere(t, { jlpt: 4 }, lesson as never, card, 4);
    expect(why).toEqual([
      'New at your level: a JLPT N4 word.',
      'From Tobira 第4課.',
      'The rest of the sentence uses words you know.',
    ]);
    expect(whyHere(t, { jlpt: 4 }, undefined, { ...card, reason: 'focus' }, 4)).toContain(
      'You chose to practise this kanji.',
    );
  });
});

describe('sentence grammar (L3, L5)', () => {
  it('finds catalogue points in a sentence and picks the hardest', () => {
    const found = sentenceGrammar(S.waiting);
    expect(found.length).toBeGreaterThan(0);
    const hardest = hardestGrammar(found);
    expect(hardest && Math.min(...found.map((g) => g.level))).toBe(hardest?.level);
    expect(hardestGrammar([])).toBeUndefined();
  });

  it('adds points tagged at pack time, once each', () => {
    const tagged = GRAMMAR_CATALOGUE[0];
    if (!tagged) throw new Error('empty catalogue');
    const found = sentenceGrammar({ tokens: [], grammarIds: [tagged.id, tagged.id, 'nope'] });
    expect(found.map((g) => g.id)).toEqual([tagged.id]);
  });
});

describe('teaching text in Spanish', () => {
  it('words parts of speech and why it is here', () => {
    const spanish = createTranslator('es', es, ENGLISH);
    expect(partOfSpeech(spanish, ['v5t', 'vt'])).toBe('verbo godan · verbo transitivo');
    expect(
      whyHere(spanish, { jlpt: 4 }, undefined, { reason: 'new', targets: [{} as never] }, 4)[0],
    ).toBe('Nueva en tu nivel: una palabra del JLPT N4.');
  });
});
