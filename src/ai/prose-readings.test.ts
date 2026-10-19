import { describe, expect, it } from 'vitest';
import { FIXTURES } from './fixtures/index.ts';
import {
  checkWithProse,
  proseClaims,
  proseReadings,
  proseStrings,
  surfacesOf,
} from './prose-readings.ts';
import { finalizeKanjiCandidates } from './schemas/describe-kanji.ts';
import { finalizeWord } from './schemas/explain-word.ts';
import { fakeVerifier } from './testing/context.ts';
import type { TaskName } from './types.ts';

const lang = fakeVerifier();

function claimsOf(text: string) {
  return proseClaims(text).map((claim) => `${claim.surfaces[0]}=${claim.reading}`);
}

describe('proseClaims', () => {
  it('finds furigana in half- and full-width parentheses', () => {
    expect(claimsOf('紹介 (しょかい) is wrong.')).toEqual(['紹介=しょかい']);
    expect(claimsOf('紹介（しょうかい）')).toEqual(['紹介=しょうかい']);
    expect(claimsOf('待つ(まつ) and 持つ ( もつ )')).toEqual(['待つ=まつ', '持つ=もつ']);
  });

  it('finds "is", "as" and "read as" links and colons with two kana or more', () => {
    expect(claimsOf('so 一生 is いっしょう, one beat longer')).toEqual(['一生=いっしょう']);
    expect(claimsOf('You already read 一緒 as いっしょ.')).toEqual(['一緒=いっしょ']);
    expect(claimsOf('間 is read as あいだ here')).toEqual(['間=あいだ']);
    expect(claimsOf('間: あいだ')).toEqual(['間=あいだ']);
  });

  it('stays quiet on prose that only names kanji or quotes Japanese', () => {
    expect(claimsOf('You read it as 持, to hold. 生 here is しょう.')).toEqual([]);
    expect(claimsOf('間 alone means "the whole time".')).toEqual([]);
    expect(claimsOf('電車を待っている（　）、ずっと音楽を聞いていた。')).toEqual([]);
    expect(claimsOf('テレビ (てれび)')).toEqual([]);
    expect(claimsOf('例: しずかな町')).toEqual([]);
    expect(claimsOf('紹介 is a noun; ま is short.')).toEqual([]);
  });

  it.each([
    ['en', 'Note that 紹介 is read as しょかい here.', '紹介=しょかい'],
    ['en', 'The reading of 間 is あいだ.', '間=あいだ'],
    ['en', '紹介, reading しょうかい, means introducing.', '紹介=しょうかい'],
    ['fr', '« 紹介 » se lit « しょかい ».', '紹介=しょかい'],
    ['fr', 'Ici 紹介 se prononce しょうかい.', '紹介=しょうかい'],
    ['fr', 'La lecture de 紹介 est しょうかい.', '紹介=しょうかい'],
    ['fr', '紹介 (lecture : しょうかい) veut dire présenter.', '紹介=しょうかい'],
    ['es', 'Aquí 紹介 se lee しょうかい.', '紹介=しょうかい'],
    ['es', 'La lectura de 紹介 es «しょかい».', '紹介=しょかい'],
    ['es', '紹介, lectura しょうかい.', '紹介=しょうかい'],
    ['ja', '「紹介」は「しょうかい」と読みます。', '紹介=しょうかい'],
    ['ja', '紹介を しょかい と読むのはまちがいです。', '紹介=しょかい'],
    ['ja', '「待つ」の読み方は「まつ」です。', '待つ=まつ'],
    ['ja', '紹介の読みはしょうかいです。', '紹介=しょうかい'],
    ['ja', '紹介「しょうかい」は名詞です。', '紹介=しょうかい'],
    ['any', '紹介＝しょうかい', '紹介=しょうかい'],
    ['any', '間 = あいだ', '間=あいだ'],
    ['any', '生（セイ）と生【なま】', '生=セイ'],
  ])('finds a reading claim in %s prose: %s', (_language, text, claim) => {
    expect(claimsOf(text)).toContain(claim);
  });

  it.each([
    ['fr', 'Le kanji 紹 veut dire présenter; il est dans 紹介.'],
    ['es', 'La palabra 紹介 es un sustantivo.'],
    ['ja', '友達と「さくら」を見ました。'],
    ['ja', '駅で友達を待っています。'],
    ['ja', '「紹介」は名詞です。'],
  ])('finds no claim in %s prose that gives none: %s', (_language, text) => {
    expect(claimsOf(text)).toEqual([]);
  });

  it('extracts nothing unexpected from the recorded replies', () => {
    const found = Object.entries(FIXTURES).flatMap(([task, { fixtures }]) =>
      fixtures.flatMap((fixture) =>
        proseStrings(fixture.response)
          .flatMap(proseClaims)
          .map((claim) => `${task as TaskName}:${claim.surfaces[0]}=${claim.reading}`),
      ),
    );
    expect(found).toEqual([
      'explainMistake:紹=しょう',
      'explainMistake:一生=いっしょう',
      'explainMistake:一緒=いっしょ',
      'explainMistake:一生=いっしょう',
      // R10: the tutor wrote the less common reading; it is verified and marked as such.
      'explainWord:日本人=にっぽんじん',
      // The no-spoil fixture leaks on purpose; its filter runs before the prose readings (L3).
      'explainSentence:紹介=しょうかい',
      'explainSentence:紹介=しょうかい',
      'memoryHook:時=とき',
    ]);
  });
});

describe('surfacesOf', () => {
  it('shows one word whole and a phrase by its last word, then tries every word start', () => {
    expect(surfacesOf('紹介')).toEqual(['紹介']);
    expect(surfacesOf('お茶')).toEqual(['お茶', '茶']);
    expect(surfacesOf('待つ')).toEqual(['待つ', '待']);
    expect(surfacesOf('友達を待っている')).toEqual([
      '待っている',
      '待',
      '友達を待っている',
      '友達を待',
    ]);
  });
});

describe('proseStrings', () => {
  it('collects every string except the reading claims', () => {
    const raw = {
      text: 'a',
      quiz: { question: 'b', options: ['c', 'd'], answerIndex: 0 },
      reading: { surface: '紹介', reading: 'しょかい' },
      readings: [{ surface: '本', reading: 'ほん' }],
      flag: true,
    };
    expect(proseStrings(raw)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('checkWithProse', () => {
  it('marks a wrong reading the model wrote but did not list', async () => {
    const raw = { explanation: '紹介 (しょかい) is introducing.', readings: [] };
    expect(await checkWithProse(lang, [], raw)).toEqual([
      { surface: '紹介', reading: 'しょかい', verified: false },
    ]);
  });

  it.each([
    ['fr', { explanation: '« 紹介 » se lit « しょかい » : il manque le う.' }],
    ['es', { explanation: 'Aquí 紹介 se lee しょかい, sin la う.' }],
    ['ja', { explanation: '「紹介」は「しょかい」と読みます。' }],
  ])('marks a wrong %s prose reading unverified (Issue 33)', async (_language, raw) => {
    expect(await checkWithProse(lang, [], raw)).toEqual([
      { surface: '紹介', reading: 'しょかい', verified: false },
    ]);
  });

  it('keeps listed claims first and adds only the prose ones they miss', async () => {
    const raw = { text: '一生 is いっしょう, and 一緒 is いっしょ.' };
    const listed = [{ surface: '一生', reading: 'いっしょう' }];
    expect(await checkWithProse(lang, listed, raw)).toEqual([
      { surface: '一生', reading: 'いっしょう', verified: true },
      { surface: '一緒', reading: 'いっしょ', verified: true },
    ]);
  });

  it('verifies furigana on any word it may belong to', async () => {
    const raw = { text: '友達を待っている(まっている)。お茶 is おちゃ' };
    expect(await proseReadings(lang, raw, [])).toEqual([
      { surface: '待っている', reading: 'まっている', verified: false },
      { surface: 'お茶', reading: 'おちゃ', verified: false },
    ]);
    const known = fakeVerifier({ 待っている: ['まっている'], 茶: ['ちゃ'], お茶: ['おちゃ'] });
    expect(await proseReadings(known, raw, [])).toEqual([
      { surface: '待っている', reading: 'まっている', verified: true },
      { surface: 'お茶', reading: 'おちゃ', verified: true },
    ]);
  });

  it('skips claims already known, such as the word reading, and repeats', async () => {
    const raw = { nuance: '紹介 (しょかい). Again: 紹介 (しょかい).' };
    const known = [{ surface: '紹介', reading: 'しょかい', verified: false }];
    expect(await proseReadings(lang, raw, known)).toEqual([]);
    expect(await proseReadings(lang, raw, [])).toHaveLength(1);
  });
});

describe('tasks check their prose', () => {
  it('describeKanji marks a reason reading and accepts replies without readings', async () => {
    const raw = { candidates: [{ char: '待', reason: 'as in 待つ (もつ)' }] };
    const value = await finalizeKanjiCandidates(raw, undefined, lang);
    expect(value.readings).toEqual([{ surface: '待つ', reading: 'もつ', verified: false }]);
    const listed = { ...raw, readings: [{ surface: '待つ', reading: 'まつ' }] };
    expect((await finalizeKanjiCandidates(listed, undefined, lang)).readings).toHaveLength(2);
  });

  it('explainWord does not repeat the word reading among the prose claims', async () => {
    const raw = {
      surface: '紹介',
      reading: { surface: '紹介', reading: 'しょかい' },
      meaning: 'introducing',
      nuance: '紹介 (しょかい) is wrong; 一生 is いっしょう.',
      chips: [],
      readings: [],
    };
    const value = await finalizeWord(raw, { sentence: { text: '' }, surface: '紹介' }, lang);
    expect(value.reading.verified).toBe(false);
    expect(value.readings).toEqual([{ surface: '一生', reading: 'いっしょう', verified: true }]);
  });
});
