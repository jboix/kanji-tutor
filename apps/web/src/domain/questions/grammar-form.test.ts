/**
 * 文法形式の判断 (J4) regressions from the question quality review: the blank covers
 * whole tokens with their ending, options fill the same slot conjugated like the answer,
 * nothing outside the blank is repeated, and giving verbs are set against each other only when
 * the particles rule them out.
 */
import { describe, expect, it } from 'vitest';
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import type { Sentence, Token } from '../types.ts';
import { frameBefore, givingAllowed } from './giving.ts';
import { grammarFormQuestion } from './grammar-form.ts';
import type { ChoiceQuestion } from './types.ts';

type T = [surface: string, pos: string, base?: string];

/** A sentence from [surface, pos, base] tokens, with start offsets computed. */
function sentence(id: string, parts: readonly T[], translation = `${id} in English`): Sentence {
  let start = 0;
  const tokens = parts.map(([surface, pos, base]): Token => {
    const token = { surface, reading: surface, base: base ?? surface, pos, start };
    start += surface.length;
    return token;
  });
  const text = parts.map(([surface]) => surface).join('');
  return { id, text, translation, source: 'tatoeba', tokens, wordIds: [], verified: true };
}

const ask = (s: Sentence, extra: Partial<Parameters<typeof grammarFormQuestion>[0]> = {}) =>
  grammarFormQuestion({ sentence: s, catalogue: GRAMMAR_CATALOGUE, seed: 'j4', ...extra });

const texts = (q: ChoiceQuestion | undefined) => q?.options.map((o) => o.text) ?? [];
const wrong = (q: ChoiceQuestion | undefined) =>
  q?.options.filter((_, i) => i !== q.answer).map((o) => o.text) ?? [];

const MASHITA: T[] = [
  ['まし', 'auxiliary', 'ます'],
  ['た', 'auxiliary'],
];

/** クリスマスに何をもらいましたか。 The screenshot's sentence: no particle rules a verb out. */
const christmas = sentence('christmas', [
  ['クリスマス', 'noun'],
  ['に', 'particle'],
  ['何', 'pronoun'],
  ['を', 'particle'],
  ['もらい', 'verb', 'もらう'],
  ...MASHITA,
  ['か', 'particle'],
  ['。', 'symbol'],
]);

/** 友達から本をもらいました。 から leaves only もらう. */
const fromFriend = sentence('from-friend', [
  ['友達', 'noun'],
  ['から', 'particle'],
  ['本', 'noun'],
  ['を', 'particle'],
  ['もらい', 'verb', 'もらう'],
  ...MASHITA,
  ['。', 'symbol'],
]);

/** 先生が私に本を読んでくださいました。 私に rules out giving away. */
const readToMe = sentence('read-to-me', [
  ['先生', 'noun'],
  ['が', 'particle'],
  ['私', 'pronoun'],
  ['に', 'particle'],
  ['本', 'noun'],
  ['を', 'particle'],
  ['読ん', 'verb', '読む'],
  ['で', 'particle'],
  ['ください', 'verb', 'くださる'],
  ...MASHITA,
  ['。', 'symbol'],
]);

/** 窓が開いています。 */
const open = sentence('open', [
  ['窓', 'noun'],
  ['が', 'particle'],
  ['開い', 'verb', '開く'],
  ['て', 'particle'],
  ['い', 'verb', 'いる'],
  ['ます', 'auxiliary'],
  ['。', 'symbol'],
]);

describe('the blank', () => {
  it('never cuts a verb stem: もらいました, not もら', () => {
    const q = ask(fromFriend);
    expect(q?.stem).toMatchObject({ before: '友達から本を', target: 'もらいました', after: '。' });
    expect(texts(q)).not.toContain('もら');
    expect(ask(christmas)?.stem.target).not.toBe('もら');
  });

  it('keeps what all options share outside: the を before a giving verb, the て of a te-form', () => {
    const q = ask(fromFriend);
    expect(texts(q).some((t) => t.startsWith('を'))).toBe(false);
    const te = ask(open);
    expect(te?.stem).toMatchObject({ before: '窓が開いて', target: 'います' });
    expect(texts(te).some((t) => t.startsWith('て'))).toBe(false);
  });

  it('conjugates every option like the answer', () => {
    expect(wrong(ask(fromFriend)).every((t) => t.endsWith('ました'))).toBe(true);
    // Polite like います: ます for verbs, です for an adjective (もいいです).
    expect(wrong(ask(open)).every((t) => /(ます|です)$/u.test(t))).toBe(true);
  });
});

describe('giving and receiving', () => {
  it('asks nothing when the particles rule no giving verb out (the screenshot case)', () => {
    expect(ask(christmas)).toBeUndefined();
  });

  it('sets もらう against giving verbs after Xから', () => {
    const q = ask(fromFriend);
    expect(wrong(q)).toEqual(expect.arrayContaining(['くれました', 'あげました']));
    expect(wrong(q)).not.toContain('いただきました');
    expect(q?.itemId).toBe('grammar:morau');
  });

  it('sets くださる against giving away after 私に, never against くれる or もらう', () => {
    const q = ask(readToMe);
    expect(q?.stem.target).toBe('くださいました');
    expect(wrong(q).sort()).toEqual(['あげました', 'さしあげました', 'やりました'].sort());
  });

  it('reads the frame from the particles of the sentence', () => {
    const frame = frameBefore(fromFriend.tokens, 4);
    expect(frame).toEqual({ from: true, toMe: false, meSubject: false });
    expect(frameBefore(readToMe.tokens, 8)).toMatchObject({ toMe: true });
    expect(givingAllowed('morau', 'itadaku', frame)).toBe(false);
    expect(givingAllowed('morau', 'kureru', frame)).toBe(true);
    expect(givingAllowed('te-iru', 'kureru', frame)).toBe(true);
  });
});

describe('distractors', () => {
  it('drops a form that makes a sentence of the packs: it fits too', () => {
    const known = (text: string) => text === '友達から本をくれました。';
    expect(wrong(ask(fromFriend, { known }))).not.toContain('くれました');
  });

  it('honours skip and needs a translation', () => {
    expect(ask(fromFriend, { skip: new Set(['morau']) })).toBeUndefined();
    const { translation: _, ...bare } = fromFriend;
    expect(ask(bare)).toBeUndefined();
  });

  it('never sets interchangeable forms against each other', () => {
    const must = sentence('must', [
      ['行か', 'verb', '行く'],
      ['なけれ', 'auxiliary', 'ない'],
      ['ば', 'particle'],
      ['なり', 'verb', 'なる'],
      ['ませ', 'auxiliary', 'ます'],
      ['ん', 'auxiliary'],
      ['。', 'symbol'],
    ]);
    const q = ask(must);
    expect(q?.stem.target).toBe('なければなりません');
    for (const same of ['なくてはいけません', 'ないといけません', 'なきゃ']) {
      expect(texts(q)).not.toContain(same);
    }
  });

  it('keeps closing forms (でしょう, ようだ) out of a blank something else follows', () => {
    const learn = sentence('learn', [
      ['テニス', 'noun'],
      ['が', 'particle'],
      ['できる', 'verb'],
      ['よう', 'noun'],
      ['に', 'particle'],
      ['なる', 'verb'],
      ['でしょ', 'auxiliary', 'です'],
      ['う', 'auxiliary'],
      ['。', 'symbol'],
    ]);
    const q = ask(learn);
    expect(q?.stem.target).toBe('ようになる');
    expect(wrong(q).some((t) => /(だ|かもしれない|はずだ)$/u.test(t))).toBe(false);
  });

  it('never offers a form a loose translation lets pass (雨になる / 雨みたいだ)', () => {
    const rain = sentence('rain', [
      ['空', 'noun'],
      ['が', 'particle'],
      ['暗い', 'adjective'],
      ['から', 'particle'],
      ['雨', 'noun'],
      ['に', 'particle'],
      ['なる', 'verb'],
      ['。', 'symbol'],
    ]);
    // みたいだ, らしい and 予定だ are the forms that fill the slot; each could pass for right.
    expect(ask(rain)).toBeUndefined();
    expect(
      ask(rain, { catalogue: GRAMMAR_CATALOGUE.filter((e) => e.family !== 'change') }),
    ).toBeUndefined();
  });

  it('never sets はずがない against わけがない, or しまったら against おいたら', () => {
    const cannot = sentence('cannot', [
      ['彼', 'pronoun'],
      ['は', 'particle'],
      ['見', 'verb', '見る'],
      ['た', 'auxiliary'],
      ['はず', 'noun'],
      ['が', 'particle'],
      ['ない', 'adjective'],
      ['。', 'symbol'],
    ]);
    expect(texts(ask(cannot))).not.toContain('わけがない');
    const washed = sentence('washed', [
      ['手', 'noun'],
      ['を', 'particle'],
      ['洗っ', 'verb', '洗う'],
      ['て', 'particle'],
      ['しまっ', 'verb', 'しまう'],
      ['たら', 'auxiliary'],
      ['来', 'verb', '来る'],
      ['て', 'particle'],
      ['。', 'symbol'],
    ]);
    const q = ask(washed);
    expect(q?.stem.target).toBe('しまったら');
    expect(texts(q)).not.toContain('おいたら');
  });
});
