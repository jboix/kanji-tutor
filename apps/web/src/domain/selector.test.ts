import { describe, expect, it } from 'vitest';
import { newCard } from './scheduler.ts';
import { isIPlusOne, type SessionInput, selectSession, unknownTokens } from './selector.ts';
import type { WordLevels } from './session-types.ts';
import type { Item, ItemKind, KnowledgeLevel, Sentence, Token } from './types.ts';

/** [surface, reading, pos, wordId?] */
type Part = [string, string, string, string?];

/** Builds a pre-tokenized sentence; word ids are the dictionary forms for readability. */
function sentence(id: string, parts: Part[], extra: Partial<Sentence> = {}): Sentence {
  let start = 0;
  const tokens: Token[] = parts.map(([surface, reading, pos, wordId]) => {
    const token: Token = { surface, reading, base: surface, pos, start };
    if (wordId) token.wordId = wordId;
    start += surface.length;
    return token;
  });
  const wordIds = [...new Set(tokens.flatMap((t) => (t.wordId ? [t.wordId] : [])))];
  return {
    id,
    text: parts.map(([surface]) => surface).join(''),
    source: 'tatoeba',
    tokens,
    wordIds,
    verified: true,
    ...extra,
  };
}

const WA: Part = ['は', 'わ', 'particle'];
const NI: Part = ['に', 'に', 'particle'];
const WO: Part = ['を', 'を', 'particle'];
const MASU: Part = ['ます', 'ます', 'auxiliary'];
const MARU: Part = ['。', '。', 'symbol'];
const WATASHI: Part = ['私', 'わたし', 'pronoun', '私'];
const IKI: Part = ['行き', 'いき', 'verb', '行く'];
const GAKKOU: Part = ['学校', 'がっこう', 'noun', '学校'];
const TOMODACHI: Part = ['友達', 'ともだち', 'noun', '友達'];
const TEGAMI: Part = ['手紙', 'てがみ', 'noun', '手紙'];
const KAKI: Part = ['書き', 'かき', 'verb', '書く'];
const SHOUKAI: Part = ['紹介', 'ショウカイ', 'noun', '紹介'];
const SHI: Part = ['し', 'し', 'verb', 'する'];
const KOOHII: Part = ['コーヒー', 'こーひー', 'noun', 'コーヒー'];
const NOMI: Part = ['飲み', 'のみ', 'verb', '飲む'];
const TOKYO: Part = ['東京', 'とうきょう', 'noun'];

/** 私は学校に行きます。 */
const S_SCHOOL = sentence('s-school', [WATASHI, WA, GAKKOU, NI, IKI, MASU, MARU]);
/** 私は友達に手紙を書きます。 */
const S_LETTER = sentence('s-letter', [WATASHI, WA, TOMODACHI, NI, TEGAMI, WO, KAKI, MASU, MARU]);
/** 私は手紙を書きます。 */
const S_LETTER_SHORT = sentence('s-letter-short', [WATASHI, WA, TEGAMI, WO, KAKI, MASU, MARU]);
/** 友達を紹介します。 */
const S_INTRO = sentence('s-intro', [TOMODACHI, WO, SHOUKAI, SHI, MASU, MARU], {
  grammarIds: ['shimasu'],
});
/** 私はコーヒーを飲みます。 */
const S_COFFEE = sentence('s-coffee', [WATASHI, WA, KOOHII, WO, NOMI, MASU, MARU]);
/** 私は東京に行きます。 (東京 did not resolve to a word id) */
const S_TOKYO = sentence('s-tokyo', [WATASHI, WA, TOKYO, NI, IKI, MASU, MARU]);

const levels = (entries: Record<string, KnowledgeLevel>): WordLevels =>
  new Map(Object.entries(entries));

const BASE_LEVELS = levels({ 私: 4, 行く: 3, 書く: 3, 飲む: 3, 学校: 1 });

const NOW = Date.UTC(2026, 9, 17);

function item(ref: string, level: KnowledgeLevel, due?: number, kind: ItemKind = 'word'): Item {
  const result: Item = {
    id: `${kind}:${ref}`,
    kind,
    ref,
    level,
    source: { kind: 'textbook', lesson: 'L4', week: '2026-W42', addedAt: 0 },
    updatedAt: 0,
  };
  if (due !== undefined) result.card = { ...newCard(0), due, state: 2 };
  return result;
}

function input(overrides: Partial<SessionInput>): SessionInput {
  return {
    sentences: [S_SCHOOL, S_LETTER, S_LETTER_SHORT, S_INTRO, S_COFFEE, S_TOKYO],
    levels: BASE_LEVELS,
    due: [],
    fresh: [],
    size: 10,
    now: NOW,
    ...overrides,
  };
}

const summary = (cards: ReturnType<typeof selectSession>) =>
  cards.map((c) => [c.sentence.id, c.reason, c.targets.map((t) => t.wordId)]);

describe('unknownTokens', () => {
  it.each([
    ['one unknown noun', S_SCHOOL, BASE_LEVELS, [2]],
    ['everything known', S_SCHOOL, levels({ 私: 4, 行く: 3, 学校: 3 }), []],
    ['untracked words count as level 0', S_LETTER, BASE_LEVELS, [2, 4]],
    ['level 2 is not yet known', S_SCHOOL, levels({ 私: 2, 行く: 3, 学校: 3 }), [0]],
    ['kana-only words (する, コーヒー) never count', S_COFFEE, BASE_LEVELS, []],
    ['a kanji token without a word id counts', S_TOKYO, BASE_LEVELS, [2]],
    ['particles, auxiliaries and 。 never count', S_INTRO, levels({}), [0, 2]],
  ] as const)('%s', (_name, s, lv, expected) => {
    expect(unknownTokens(s, lv)).toEqual(expected);
  });
});

describe('isIPlusOne', () => {
  it.each([
    ['one target', S_SCHOOL, BASE_LEVELS, true],
    ['two targets', S_LETTER, BASE_LEVELS, true],
    ['nothing new', S_SCHOOL, levels({ 私: 4, 行く: 3, 学校: 3 }), false],
    ['three unknowns', S_LETTER, levels({ 私: 4 }), false],
    ['unknown without a word id', S_TOKYO, BASE_LEVELS, false],
  ] as const)('%s → %s', (_name, s, lv, expected) => {
    expect(isIPlusOne(s, lv)).toBe(expected);
  });
});

describe('selectSession', () => {
  it('puts due items first, soonest due first, then fresh items', () => {
    const cards = selectSession(
      input({
        levels: levels({ 私: 4, 行く: 3, 書く: 3, 学校: 3, 手紙: 3, 友達: 3 }),
        due: [item('手紙', 3, NOW - 1000), item('学校', 3, NOW - 5000)],
        fresh: [item('紹介', 1)],
      }),
    );
    expect(summary(cards)).toEqual([
      ['s-school', 'due', ['学校']],
      ['s-letter', 'due', ['手紙']],
      ['s-intro', 'new', ['紹介']],
    ]);
  });

  it('sets hiragana readings and token positions on targets', () => {
    const [card] = selectSession(input({ fresh: [item('紹介', 1)], levels: levels({ 友達: 3 }) }));
    expect(card?.targets).toEqual([
      {
        tokenIndex: 2,
        itemId: 'word:紹介',
        wordId: '紹介',
        surface: '紹介',
        readings: ['しょうかい'],
      },
    ]);
  });

  it('adds the other unknown word as a second target and does not target it twice', () => {
    const cards = selectSession(
      input({
        sentences: [S_LETTER, S_LETTER_SHORT],
        fresh: [item('手紙', 1), item('友達', 1)],
        levels: levels({ 私: 4, 書く: 3 }),
      }),
    );
    expect(summary(cards)).toEqual([['s-letter-short', 'new', ['手紙']]]);
  });

  it('uses a two-target sentence when no single-target one is left', () => {
    const cards = selectSession(
      input({
        sentences: [S_LETTER],
        fresh: [item('手紙', 1), item('友達', 1)],
        levels: levels({ 私: 4, 書く: 3 }),
      }),
    );
    expect(summary(cards)).toEqual([['s-letter', 'new', ['友達', '手紙']]]);
  });

  it('never repeats a sentence and respects size', () => {
    const lv = levels({ 私: 4, 行く: 3, 書く: 3, 学校: 3, 手紙: 3, 友達: 3 });
    const due = [item('私', 4, NOW), item('書く', 3, NOW + 1), item('学校', 3, NOW + 2)];
    expect(summary(selectSession(input({ levels: lv, due })))).toEqual([
      ['s-school', 'due', ['私']],
      ['s-letter', 'due', ['書く']],
    ]);
    expect(selectSession(input({ levels: lv, due, size: 1 }))).toHaveLength(1);
    expect(selectSession(input({ levels: lv, due, size: 0 }))).toEqual([]);
  });

  it('skips unverified sentences, overloaded sentences and untargetable items', () => {
    const unverified = { ...S_SCHOOL, id: 's-unverified', verified: false };
    const cards = selectSession(
      input({
        sentences: [unverified, S_LETTER, S_COFFEE, S_TOKYO],
        levels: levels({ 私: 4 }),
        fresh: [item('学校', 1), item('手紙', 1), item('コーヒー', 0), item('東京', 0)],
        due: [item('shimasu', 3, NOW, 'grammar')],
      }),
    );
    expect(cards).toEqual([]);
  });

  it('prefers sentences not shown recently', () => {
    const fresh = [item('手紙', 1)];
    const lv = levels({ 私: 4, 書く: 3, 友達: 3 });
    const plain = selectSession(
      input({ sentences: [S_LETTER, S_LETTER_SHORT], levels: lv, fresh }),
    );
    expect(plain[0]?.sentence.id).toBe('s-letter');
    const recent = selectSession(
      input({
        sentences: [S_LETTER, S_LETTER_SHORT],
        levels: lv,
        fresh,
        recentSentenceIds: ['s-letter'],
      }),
    );
    expect(recent[0]?.sentence.id).toBe('s-letter-short');
  });

  it('prefers plan-focus sentences and marks fresh ones as focus', () => {
    const intro2 = sentence('s-intro-plain', [TOMODACHI, WO, SHOUKAI, SHI, MASU, MARU]);
    const mix = { dailyMinutes: 10, focusErrorTypes: {}, grammarIds: ['shimasu'], drillShare: 0 };
    const cards = selectSession(
      input({
        sentences: [intro2, S_INTRO],
        levels: levels({ 友達: 3 }),
        fresh: [item('紹介', 1)],
        mix,
      }),
    );
    expect(summary(cards)).toEqual([['s-intro', 'focus', ['紹介']]]);
  });

  it('prefers targets that exercise a focus error type', () => {
    const mix = {
      dailyMinutes: 10,
      focusErrorTypes: { sokuon: 0.5 },
      grammarIds: [],
      drillShare: 0,
    };
    const lv = levels({ 私: 4, 行く: 3, 書く: 3, 手紙: 3, 友達: 3, 学校: 3 });
    const due = [item('私', 4, NOW)];
    const cards = selectSession(input({ levels: lv, due, mix }));
    expect(summary(cards)).toEqual([['s-school', 'due', ['私']]]);
    const noFocus = selectSession(
      input({ levels: lv, due, mix: { ...mix, focusErrorTypes: { 'long-vowel': 0 } } }),
    );
    expect(noFocus[0]?.sentence.id).toBe('s-school');
  });

  it.each([
    ['long-vowel', 's-b'],
    ['rendaku', 's-c'],
    ['sokuon', 's-a'],
    ['wrong-kanji', 's-a'],
  ] as const)('focus on %s picks %s', (errorType, expected) => {
    const mix = {
      dailyMinutes: 10,
      focusErrorTypes: { [errorType]: 1 },
      grammarIds: [],
      drillShare: 0,
    };
    const cards = selectSession(
      input({
        sentences: [
          sentence('s-a', [['本', 'ほん', 'noun', '本'], WO, KAKI, MASU, MARU]),
          sentence('s-b', [SHOUKAI, WO, KAKI, MASU, MARU]),
          sentence('s-c', [TEGAMI, WO, KAKI, MASU, MARU]),
        ],
        levels: levels({ 書く: 3 }),
        due: [item('書く', 3, NOW)],
        mix,
      }),
    );
    expect(cards[0]?.sentence.id).toBe(expected);
  });

  it('is deterministic', () => {
    const args = input({ fresh: [item('学校', 1), item('手紙', 1), item('紹介', 1)] });
    expect(selectSession(args)).toEqual(selectSession(args));
  });
});
