import { describe, expect, it } from 'vitest';
import { S, W } from '../../test/reading-fixtures.ts';
import { GRAMMAR_CATALOGUE } from '../grammar/catalogue.ts';
import type { GrammarEntry } from '../grammar/types.ts';
import type { Kanji, Sentence, Token, Word } from '../types.ts';
import { comprehensionSet, type PassageData } from './comprehension.ts';
import { contextWordQuestion } from './context-word.ts';
import { formText, grammarFormQuestion } from './grammar-form.ts';
import { kanjiReadingQuestion } from './kanji-reading.ts';
import { longVowelSlips, morae, plausible, sokuonSlips, voicingSlips } from './near-miss.ts';
import { arrange, firstGloss, meaningWords, roundRobin, sameMeaning } from './options.ts';
import { baseForm, orthographyQuestion } from './orthography.ts';
import { chunks, sentenceOrderQuestion } from './sentence-order.ts';
import { kanaTail, kanjiStem, underlineReading, underlineSpan } from './stem.ts';
import { type ChoiceQuestion, SECTION } from './types.ts';

const kanji = (char: string, on: string[], kun: string[], extra: Partial<Kanji> = {}): Kanji => ({
  char,
  meanings: [`m-${char}`],
  on,
  kun,
  components: [],
  ...extra,
});

const MATSU = kanji('待', ['タイ'], ['ま.つ'], { meanings: ['wait'], components: ['彳', '寺'] });
const MOTSU = kanji('持', ['ジ'], ['も.つ'], { meanings: ['hold'], components: ['扌', '寺'] });
const JI = kanji('時', ['ジ'], ['とき'], { meanings: ['time'], components: ['日', '寺'] });
const TOKU = kanji('特', ['トク'], [], { meanings: ['special'], components: ['牛', '寺'] });
const UTSU = kanji('打', ['ダ'], ['う.つ'], { meanings: ['hit'], components: ['扌', '丁'] });
const TATSU = kanji('立', ['リツ'], ['た.つ'], { meanings: ['stand'], components: ['立'] });

const texts = (q: { options: { text: string }[] }) => q.options.map((o) => o.text);
const right = (q: { options: { text: string }[]; answer: number }) => q.options[q.answer]?.text;

describe('near-miss readings', () => {
  it('splits morae with small kana attached', () => {
    expect(morae('しょうかい')).toEqual(['しょ', 'う', 'か', 'い']);
  });

  it('drops and adds long vowels, with a note', () => {
    const slips = longVowelSlips('しょうかい');
    expect(slips).toContainEqual({
      kana: 'しょかい',
      slip: 'long-vowel',
      note: { code: 'long-vowel-dropped', params: { kana: 'しょかい', mora: 'しょう' } },
    });
    expect(longVowelSlips('とも').map((s) => s.kana)).toContain('とうも');
  });

  it('drops, adds and makes small っ', () => {
    expect(sokuonSlips('まって').map((s) => s.kana)).toContain('まて');
    expect(sokuonSlips('がくせい').map((s) => s.kana)).toEqual(
      expect.arrayContaining(['がくっせい', 'がっせい']),
    );
    expect(sokuonSlips('せんせい').map((s) => s.kana)).not.toContain('せんっせい');
  });

  it('voices and unvoices, calling only a later mora rendaku', () => {
    const slips = voicingSlips('がくせい');
    expect(slips[0]).toMatchObject({ kana: 'かくせい', slip: 'other' });
    expect(slips).toContainEqual({
      kana: 'がぐせい',
      slip: 'rendaku',
      note: { code: 'voiced', params: { kana: 'がぐせい', mora: 'く', voiced: 'ぐ' } },
    });
  });

  it('rejects readings nobody would write', () => {
    expect(plausible('っき')).toBe(false);
    expect(plausible('んき')).toBe(false);
    expect(plausible('まっ')).toBe(false);
    expect(plausible('まっって')).toBe(false);
    expect(plausible('')).toBe(false);
    expect(plausible('まって')).toBe(true);
  });
});

describe('option helpers', () => {
  const o = (text: string) => ({ text, note: text });

  it('arranges four distinct options with the answer tracked', () => {
    const arranged = arrange(o('a'), [o('b'), o('B'), o('a'), o(''), o('c'), o('d')], 's');
    expect(arranged?.options).toHaveLength(4);
    expect(new Set(arranged?.options.map((x) => x.text))).toEqual(new Set(['a', 'b', 'c', 'd']));
    expect(arranged?.options[arranged.answer]?.text).toBe('a');
  });

  it('treats kana scripts as the same option and gives up under four', () => {
    expect(arrange(o('まつ'), [o('マツ'), o('もつ'), o('たつ')], 's')).toBeUndefined();
  });

  it('is stable for a seed', () => {
    const wrong = [o('b'), o('c'), o('d')];
    expect(arrange(o('a'), wrong, 'x')).toEqual(arrange(o('a'), wrong, 'x'));
  });

  it('takes lists in turn', () => {
    expect(roundRobin([[1, 2, 3], [4], [5, 6]])).toEqual([1, 4, 5, 2, 6, 3]);
    expect(roundRobin([])).toEqual([]);
  });

  it('compares meanings by content words', () => {
    expect([...meaningWords(['to wait; to await'])]).toEqual(['wait', 'await']);
    expect(sameMeaning(['must, have to'], ['have to (personal need)'])).toBe(true);
    expect(sameMeaning(['station'], ['book'])).toBe(false);
    expect(firstGloss(['to wait; to await', 'x'])).toBe('to wait');
    expect(firstGloss([])).toBe('');
  });

  it('cuts written forms into stem and okurigana', () => {
    expect(kanaTail('待って')).toBe('って');
    expect(kanjiStem('待って')).toBe('待');
    expect(kanaTail('駅')).toBe('');
  });
});

const KANJI = new Map([MATSU, MOTSU, JI, TOKU].map((k) => [k.char, k]));
const waitIndex = S.waitPlain.tokens.findIndex((t) => t.surface === '待つ');
const waitingIndex = S.waiting.tokens.findIndex((t) => t.surface === '待っ');

describe('漢字読み (J1)', () => {
  const question = (sentence: Sentence, tokenIndex: number, homographs: Word[] = []) =>
    kanjiReadingQuestion({
      sentence,
      tokenIndex,
      word: W.matsu,
      homographs,
      kanji: KANJI,
      seed: 'j1',
    });
  const GAKU = kanji('学', ['ガク'], ['まな.ぶ']);
  const SEI = kanji('生', ['セイ', 'ショウ'], ['い.きる', 'う.まれる', 'なま']);
  const gakusei = (homographs: Word[] = []) =>
    kanjiReadingQuestion({
      sentence: S.student,
      tokenIndex: 0,
      word: W.gakusei,
      homographs,
      kanji: new Map([GAKU, SEI].map((k) => [k.char, k])),
      seed: 'j1',
    });

  it('underlines the word and offers near-misses inside its kanji readings', () => {
    const q = gakusei();
    expect(q?.section).toBe(SECTION['kanji-reading']);
    expect(q?.stem).toMatchObject({ target: '学生', mark: 'underline', before: '' });
    expect(right(q as ChoiceQuestion)).toBe('がくせい');
    const wrong = q?.options.filter((_, i) => i !== q.answer) ?? [];
    const noted = (w: (typeof wrong)[number]) =>
      typeof w.note !== 'string' && w.note.params.kana === w.text && w.slip !== undefined;
    expect(wrong.every(noted)).toBe(true);
    // An on compound swaps on readings for on readings, never a kun one (がくうまれ).
    const all = [...texts(q as ChoiceQuestion)];
    expect(all.some((t) => /うまれ|なま|まな/u.test(t))).toBe(false);
  });

  it('never slips a long vowel, っ or voicing into okurigana or a one-kana kun stem', () => {
    // 待って: ま is one kana of a kun reading; たいって (an on reading before okurigana),
    // まって with a slip in って, or まあって are no readings a learner would write.
    expect(question(S.waiting, waitingIndex)).toBeUndefined();
    expect(question(S.waitPlain, waitIndex)).toBeUndefined();
  });

  it('adds long vowels only to a one-mora on reading and っ only between kanji', () => {
    const q = gakusei();
    const all = texts(q as ChoiceQuestion);
    for (const bad of ['がくせいう', 'がうくせい', 'がくっせい', 'がっくせい']) {
      expect(all).not.toContain(bad);
    }
  });

  it('never offers a reading of a word written the same way', () => {
    const homograph: Word = { ...W.gakusei, id: 'h', readings: ['がくしょう'] };
    const q = gakusei([homograph]);
    expect(q).toBeDefined();
    expect(texts(q as ChoiceQuestion)).not.toContain('がくしょう');
  });

  it('underlines a verb with its endings but not the copula after it', () => {
    const sentence: Sentence = {
      ...S.student,
      id: 'tai-desu',
      text: '学生に会いたいです。',
      tokens: [
        { surface: '学生', reading: 'がくせい', base: '学生', pos: 'noun', start: 0 },
        { surface: 'に', reading: 'に', base: 'に', pos: 'particle', start: 2 },
        { surface: '会い', reading: 'あい', base: '会う', pos: 'verb', start: 3 },
        { surface: 'たい', reading: 'たい', base: 'たい', pos: 'auxiliary', start: 5 },
        { surface: 'です', reading: 'です', base: 'です', pos: 'auxiliary', start: 7 },
        { surface: '。', reading: '。', base: '。', pos: 'symbol', start: 9 },
      ],
    };
    expect(underlineSpan(sentence, 2)).toEqual([2, 3]);
    expect(underlineReading(sentence, 2)).toBe('あいたい');
  });

  it('never offers a valid variant of the reading as a wrong option (D56)', () => {
    const plain = gakusei() as ChoiceQuestion;
    const variant = texts(plain).find((t) => t !== right(plain)) ?? '';
    const tokens = S.student.tokens.map((t, i) => (i === 0 ? { ...t, variants: [variant] } : t));
    const q = kanjiReadingQuestion({
      sentence: { ...S.student, tokens },
      tokenIndex: 0,
      word: W.gakusei,
      homographs: [],
      kanji: new Map([GAKU, SEI].map((k) => [k.char, k])),
      seed: 'j1',
    });
    expect(variant).not.toBe('');
    expect(q).toBeDefined();
    expect(right(q as ChoiceQuestion)).toBe('がくせい');
    expect(texts(q as ChoiceQuestion)).not.toContain(variant);
  });

  it('gives up on a kana token', () => {
    const kana = S.waiting.tokens.findIndex((t) => t.surface === 'いる');
    expect(question(S.waiting, kana)).toBeUndefined();
  });
});

describe('表記 (J2)', () => {
  const lookalikes = new Map([['待', [MOTSU, JI, TOKU, UTSU, TATSU]]]);
  const input = (byForm: Map<string, Word[]> = new Map(), homophones: Word[] = []) => ({
    sentence: S.waiting,
    tokenIndex: waitingIndex,
    word: W.matsu,
    kanji: KANJI,
    lookalikes,
    homophones,
    byForm,
    seed: 'j2',
  });

  it('shows the kana underlined and offers lookalike spellings', () => {
    const q = orthographyQuestion(input());
    expect(q?.stem).toMatchObject({
      target: 'まって',
      mark: 'underline',
      after: 'いる間に、本を読みました。',
    });
    expect(right(q as ChoiceQuestion)).toBe('待って');
    // 時 and 特 take no okurigana: 時って is no spelling anyone would write.
    expect(texts(q as ChoiceQuestion).sort()).toEqual(
      ['持って', '打って', '立って', '待って'].sort(),
    );
    const motte = q?.options.find((o) => o.text === '持って');
    expect(motte?.swap).toEqual(['待', '持']);
    expect(motte?.note).toEqual({
      code: 'swap-parts',
      params: {
        text: '持って',
        wrong: '持',
        wrongMeaning: 'hold',
        right: '待',
        rightMeaning: 'wait',
        mine: '彳',
        theirs: '扌',
      },
    });
  });

  it('gives up when the rest of the sentence shows the spelling (この本とあの本)', () => {
    const twice: Sentence = {
      ...S.student,
      id: 'twice',
      text: '本と本',
      tokens: [
        { surface: '本', reading: 'ほん', base: '本', pos: 'noun', start: 0, wordId: W.hon.id },
        { surface: 'と', reading: 'と', base: 'と', pos: 'particle', start: 1 },
        { surface: '本', reading: 'ほん', base: '本', pos: 'noun', start: 2, wordId: W.hon.id },
      ],
    };
    const HON = kanji('本', ['ホン'], ['もと'], { components: ['木'] });
    const alike = [
      kanji('木', ['モク'], ['き']),
      kanji('休', ['キュウ'], ['やす.む']),
      kanji('体', ['タイ'], ['からだ']),
    ];
    const ask = (sentence: Sentence) =>
      orthographyQuestion({
        ...input(),
        sentence,
        tokenIndex: 0,
        word: W.hon,
        kanji: new Map([['本', HON]]),
        lookalikes: new Map([['本', alike]]),
      });
    expect(ask(twice)).toBeUndefined();
    const once = {
      ...twice,
      text: '本と山',
      tokens: twice.tokens.map((t, i) => (i === 2 ? { ...t, surface: '山', base: '山' } : t)),
    };
    expect(ask(once)?.stem.target).toBe('ほん');
  });

  it('never offers a swap that is a real word read the same way', () => {
    const fake: Word = { ...W.motsu, forms: ['持つ'], readings: ['まつ'] };
    expect(orthographyQuestion(input(new Map([['持つ', [fake]]])))).toBeUndefined();
  });

  it('adds homophones of another meaning, never synonyms', () => {
    const word = (id: string, form: string, gloss: string): Word => ({
      id,
      forms: [form],
      readings: ['まつ'],
      glosses: [gloss],
      common: true,
    });
    const q = orthographyQuestion({
      ...input(),
      sentence: S.waitPlain,
      tokenIndex: waitIndex,
      lookalikes: new Map([['待', [MOTSU, JI, UTSU]]]),
      homophones: [
        word('x', '松', 'pine'),
        word('y', '俟つ', 'to wait'),
        W.matsu,
        word('z', '松つ', 'pine'),
      ],
    });
    expect(texts(q as ChoiceQuestion).sort()).toEqual(['待つ', '持つ', '打つ', '松つ'].sort());
    expect(q?.options.find((o) => o.text === '松つ')?.note).toEqual({
      code: 'another-word',
      params: { text: '松つ', gloss: 'pine' },
    });
    expect(baseForm(W.matsu, '待っ')).toBe('待つ');
  });
});

describe('文脈規定 (J3)', () => {
  const noun = (id: string, form: string, gloss: string): Word => ({
    id,
    forms: [form],
    readings: ['x'],
    glosses: [gloss],
    common: true,
    jlpt: 5,
    pos: ['n'],
  });
  const candidates = [
    noun('c1', '山', 'mountain'),
    noun('c2', '川', 'river'),
    noun('c3', '空', 'sky'),
    noun('c4', '書物', 'book'),
    W.hon,
  ];
  const hon = S.student.tokens.findIndex((t) => t.surface === '本');

  it('blanks a word and offers same-level words of other meanings', () => {
    const q = contextWordQuestion({
      sentence: S.student,
      tokenIndex: hon,
      word: W.hon,
      candidates,
      corpus: [],
      seed: 'j3',
    });
    expect(q?.stem).toMatchObject({ target: '本', mark: 'blank', before: '学生が' });
    expect(texts(q as ChoiceQuestion).sort()).toEqual(['山', '川', '本', '空'].sort());
    expect(q?.translation).toBe('s-student in English');
  });

  it('drops a word seen elsewhere in the same context', () => {
    const elsewhere: Sentence = {
      ...S.student,
      id: 'other',
      tokens: S.student.tokens.map((t, i): Token => (i === hon ? { ...t, wordId: 'c1' } : t)),
    };
    const q = contextWordQuestion({
      sentence: S.student,
      tokenIndex: hon,
      word: W.hon,
      candidates,
      corpus: [elsewhere],
      seed: 'j3',
    });
    expect(q).toBeUndefined();
  });

  it('skips inflected tokens and sentences without a translation', () => {
    const base = { word: W.matsu, candidates, corpus: [], seed: 'j3' };
    expect(
      contextWordQuestion({ ...base, sentence: S.waiting, tokenIndex: waitingIndex }),
    ).toBeUndefined();
    const { translation: _, ...bare } = S.student;
    expect(
      contextWordQuestion({ ...base, word: W.hon, sentence: bare, tokenIndex: hon }),
    ).toBeUndefined();
  });
});

/** 遅すぎる。 tokenized as the pack does. */
const tooLate: Sentence = {
  id: 'late',
  text: '遅すぎる。',
  translation: "It's too late.",
  source: 'tatoeba',
  verified: true,
  wordIds: [],
  tokens: [
    { surface: '遅', reading: 'おそ', base: '遅い', pos: 'adjective', start: 0 },
    { surface: 'すぎる', reading: 'すぎる', base: 'すぎる', pos: 'verb', start: 1 },
    { surface: '。', reading: '。', base: '。', pos: 'symbol', start: 4 },
  ],
};

describe('文法形式の判断 (J4)', () => {
  it('gives up rather than offer forms that cannot fill the same slot', () => {
    // 遅すぎる: no other point of the catalogue attaches to 遅 and conjugates like すぎる in
    // enough numbers; mixing ながら or たい in (the old options) would not be a question.
    expect(
      grammarFormQuestion({ sentence: tooLate, catalogue: GRAMMAR_CATALOGUE, seed: 'j4' }),
    ).toBeUndefined();
  });

  it('writes forms without 〜, notes or alternatives', () => {
    const entry = (pattern: string, cloze: string[]) =>
      ({ ...GRAMMAR_CATALOGUE[0], pattern, cloze }) as GrammarEntry;
    expect(formText(entry('〜ほど (程度)', ['ほど']))).toBe('ほど');
    expect(formText(entry('〜なきゃ／〜なくちゃ', ['なきゃ']))).toBe('なきゃ');
    expect(formText(entry('全然〜ない', ['全然']))).toBe('全然');
    expect(formText(entry('〜な', ['な']))).toBe('');
  });
});

describe('文の組み立て (J5)', () => {
  it('cuts content words with their particles and endings', () => {
    expect(chunks(S.waiting.tokens).map((c) => c.text)).toEqual([
      '駅で',
      '友達を',
      '待って',
      'いる',
      '間に',
      '、',
      '本を',
      '読みました',
      '。',
    ]);
  });

  it('gives up when two pieces could swap', () => {
    const tokens: Token[] = [
      { surface: '友達', reading: 'ともだち', base: '友達', pos: 'noun', start: 0, wordId: '2' },
      { surface: 'が', reading: 'が', base: 'が', pos: 'particle', start: 2 },
      { surface: '駅', reading: 'えき', base: '駅', pos: 'noun', start: 3, wordId: '1' },
      { surface: 'で', reading: 'で', base: 'で', pos: 'particle', start: 4 },
      { surface: '本', reading: 'ほん', base: '本', pos: 'noun', start: 5, wordId: '7' },
      { surface: 'を', reading: 'を', base: 'を', pos: 'particle', start: 6 },
      { surface: '読む', reading: 'よむ', base: '読む', pos: 'verb', start: 7, wordId: '8' },
    ];
    const sentence: Sentence = { ...S.student, id: 'free', text: '友達が駅で本を読む', tokens };
    expect(
      sentenceOrderQuestion({ sentence, catalogue: GRAMMAR_CATALOGUE, seed: 'j5' }),
    ).toBeUndefined();
    expect(
      sentenceOrderQuestion({ sentence: S.student, catalogue: GRAMMAR_CATALOGUE, seed: 'j5' }),
    ).toBeUndefined();
  });

  it('builds a question when one piece at most can move', () => {
    const tokens: Token[] = [
      { surface: '私', reading: 'わたし', base: '私', pos: 'pronoun', start: 0, wordId: 'w' },
      { surface: 'の', reading: 'の', base: 'の', pos: 'particle', start: 1 },
      { surface: '古い', reading: 'ふるい', base: '古い', pos: 'adjective', start: 2, wordId: 'f' },
      { surface: '本', reading: 'ほん', base: '本', pos: 'noun', start: 4, wordId: W.hon.id },
      { surface: 'は', reading: 'は', base: 'は', pos: 'particle', start: 5 },
      { surface: '赤い', reading: 'あかい', base: '赤い', pos: 'adjective', start: 6, wordId: 'a' },
      { surface: '。', reading: '。', base: '。', pos: 'symbol', start: 8 },
    ];
    const sentence: Sentence = {
      id: 'mine',
      text: '私の古い本は赤い。',
      source: 'tatoeba',
      tokens,
      wordIds: [],
      verified: true,
    };
    const q = sentenceOrderQuestion({ sentence, catalogue: GRAMMAR_CATALOGUE, seed: 'j5' });
    if (!q) throw new Error('no question');
    expect(q.kind).toBe('sentence-order');
    expect(q.order.map((i) => q.options[i]?.text).join('')).toBe('私の古い本は赤い');
    expect(q.order[q.star]).toBe(q.answer);
    expect(q.after).toBe('。');
    expect(q.itemId).toBe('word:w');
    expect(texts(q)).not.toEqual(['私の', '古い', '本は', '赤い']);
  });
});

describe('文の組み立て chunks and movable pieces', () => {
  const tok = (surface: string, pos: string, start: number, base = surface): Token => ({
    surface,
    reading: surface,
    base,
    pos,
    start,
    ...(pos === 'noun' || pos === 'verb' || pos === 'adjective' ? { wordId: surface } : {}),
  });

  it('keeps a topic first and a nominalizer bound, so 漢字は読むのが難しい is asked', () => {
    const tokens = [
      tok('漢字', 'noun', 0),
      tok('は', 'particle', 2),
      tok('読む', 'verb', 3),
      tok('の', 'noun', 5),
      tok('が', 'particle', 6),
      tok('難しい', 'adjective', 7),
      tok('。', 'symbol', 10),
    ];
    const sentence: Sentence = {
      ...S.student,
      id: 'kanji',
      text: '漢字は読むのが難しい。',
      tokens,
    };
    const q = sentenceOrderQuestion({ sentence, catalogue: GRAMMAR_CATALOGUE, seed: 'j5' });
    expect(q?.options.map((o) => o.text).sort()).toEqual(
      ['のが', '漢字は', '読む', '難しい'].sort(),
    );
  });

  it('joins the する of a noun verb to its noun', () => {
    const tokens = [
      tok('紹介', 'noun', 0),
      tok('し', 'verb', 2, 'する'),
      tok('たい', 'auxiliary', 3),
    ];
    expect(chunks(tokens).map((c) => c.text)).toEqual(['紹介したい']);
  });
});

describe('読解 (T6)', () => {
  const passage: PassageData = {
    id: 'p1',
    sentences: [
      { ja: '私は毎朝、駅まで歩きます。', en: 'I walk to the station every morning.' },
      { ja: 'それは健康のためです。', en: 'That is for my health.' },
    ],
    questions: [
      {
        kind: 'reason',
        prompt: 'なぜ歩きますか。',
        options: ['健康のため', '遅れたから', '駅が近いから', '雨だから'],
        answer: '健康のため',
        evidence: 1,
        explanation: 'Line 2 says it is for health.',
      },
      {
        kind: 'content',
        prompt: 'bad',
        options: ['a', 'a', 'b', 'c'],
        answer: 0,
        evidence: 0,
        explanation: '',
      },
      {
        kind: 'reference',
        prompt: 'bad evidence',
        options: ['a', 'b', 'c', 'd'],
        answer: 0,
        evidence: 9,
        explanation: '',
      },
    ],
    itemId: 'grammar:tame-ni',
  };

  it('keeps sound questions with evidence and notes', () => {
    const set = comprehensionSet(passage);
    expect(set?.questions).toHaveLength(1);
    const q = set?.questions[0];
    expect(q).toMatchObject({ section: '問題 · 読解', answer: 0, evidence: 1, type: 'reason' });
    expect(q?.options[1]?.note).toEqual({ code: 'line-not', params: { line: 2 } });
    expect(q?.itemId).toBe('grammar:tame-ni');
  });

  it('drops a passage with nothing sound', () => {
    expect(comprehensionSet({ ...passage, questions: passage.questions.slice(1) })).toBeUndefined();
  });
});
