import { describe, expect, it } from 'vitest';
import {
  HIDDEN_MARK,
  type HiddenReading,
  longVowelForm,
  redactReadings,
  romajiForms,
  spoilsReading,
} from './no-spoil.ts';

const MATTE: HiddenReading[] = [{ surface: '待って', readings: ['まって', 'まつ'] }];
const SHOUKAI: HiddenReading[] = [{ surface: '紹介', readings: ['しょうかい'] }];

function redact(text: string, hidden = MATTE) {
  return redactReadings(text, hidden);
}

describe('redactReadings (L3 leak fixtures)', () => {
  it.each([
    ['full-width furigana', '待って（まって）は「待つ」の て-form.', '待っては「待つ」の て-form.'],
    ['ascii furigana', 'Here 待って (まって) means waiting.', 'Here 待って means waiting.'],
    ['ruby inside the word', '待(ま)って is a て-form.', '待って is a て-form.'],
    ['lenticular brackets', '待って【まって】 waits.', '待って waits.'],
    ['katakana furigana', '待って[マッテ] waits.', '待って waits.'],
  ])('drops %s after the target', (_name, text, expected) => {
    expect(redact(text)).toEqual({ text: expected, leaked: true });
  });

  it.each([
    ['hiragana', 'You say まって here.', `You say ${HIDDEN_MARK} here.`],
    ['katakana', 'Say it as マッテ.', `Say it as ${HIDDEN_MARK}.`],
    ['the dictionary form', 'The verb is まつ, to wait.', `The verb is ${HIDDEN_MARK}, to wait.`],
    ['romaji', 'It sounds like matte.', `It sounds like ${HIDDEN_MARK}.`],
    ['capitalised romaji', 'Matte means wait.', `${HIDDEN_MARK} means wait.`],
  ])('blanks the reading in %s anywhere', (_name, text, expected) => {
    expect(redact(text)).toEqual({ text: expected, leaked: true });
  });

  it.each([
    ['is read as', '待って is read as もって here.', `待って is read as ${HIDDEN_MARK} here.`],
    ['pronounced', '待 is pronounced "ma".', `待 is pronounced ${HIDDEN_MARK}.`],
    ['a colon', '待って: もって', `待って: ${HIDDEN_MARK}`],
    ['an equals sign', '待 = ま', `待 = ${HIDDEN_MARK}`],
  ])('blanks a reading given with %s, even a wrong one', (_name, text, expected) => {
    expect(redact(text)).toEqual({ text: expected, leaked: true });
  });

  it.each([
    ['Hepburn', 'shoukai'],
    ['macron', 'shōkai'],
    ['double vowel', 'shookai'],
    ['short vowel', 'shokai'],
  ])('blanks %s romaji of a long vowel', (_name, romaji) => {
    const { text, leaked } = redact(`紹介 is ${romaji} in romaji.`, SHOUKAI);
    expect(leaked).toBe(true);
    expect(text).not.toContain(romaji);
  });

  it.each([
    [
      'split per kanji',
      '紹 is しょう and 介 is かい.',
      `紹 is ${HIDDEN_MARK} and 介 is ${HIDDEN_MARK}.`,
    ],
    ['split per kanji in French', '紹 se lit しょう.', `紹 se lit ${HIDDEN_MARK}.`],
    [
      'split per kanji with a colon',
      '紹: しょう, 介: かい',
      `紹: ${HIDDEN_MARK}, 介: ${HIDDEN_MARK}`,
    ],
  ])('blanks a reading %s (Issue 39)', (_name, text, expected) => {
    expect(redact(text, SHOUKAI)).toEqual({ text: expected, leaked: true });
  });

  it.each([
    ['kana pieces', '待 ま + つ: that is the verb.', `待 ${HIDDEN_MARK}: that is the verb.`],
    ['romaji in brackets', 'Here 待 (ma) is the stem.', 'Here 待 is the stem.'],
    ['hyphenated romaji', 'Say ma-tte slowly.', `Say ${HIDDEN_MARK} slowly.`],
    ['spaced romaji', 'Say ma tte slowly.', `Say ${HIDDEN_MARK} slowly.`],
    ['katakana', 'In katakana: マッテ.', `In katakana: ${HIDDEN_MARK}.`],
  ])('blanks %s of a hidden reading (Issue 39)', (_name, text, expected) => {
    expect(redact(text)).toEqual({ text: expected, leaked: true });
  });

  it.each([
    ['long-vowel katakana', 'Written ショーカイ in katakana.'],
    ['hyphenated romaji', 'Romaji: sho-kai.'],
    ['spaced romaji', 'It sounds like shou kai.'],
  ])('blanks %s of a long vowel (Issue 39)', (_name, text) => {
    const { text: out, leaked } = redact(text, SHOUKAI);
    expect(leaked).toBe(true);
    expect(out).toContain(HIDDEN_MARK);
    expect(out).not.toMatch(/ショーカイ|sho-kai|shou kai/);
  });

  it('keeps glosses and words that are not part of the reading', () => {
    const clean = '待 (wait) is a verb; 待 is at the start. 紹 is in 紹介.';
    expect(redact(clean)).toEqual({ text: clean, leaked: false });
    expect(redact('紹 is a kanji; 介 is too.', SHOUKAI).leaked).toBe(false);
  });

  it('writes lengthening vowels as ー', () => {
    expect(longVowelForm('ショウカイ')).toBe('ショーカイ');
    expect(longVowelForm('センセイ')).toBe('センセー');
    expect(longVowelForm('マッテ')).toBe('マッテ');
  });

  it('keeps clean prose, English glosses and other readings unchanged', () => {
    const clean = '待って: waiting. 駅 (えき) is the station; the sentence is about waiting.';
    expect(redact(clean)).toEqual({ text: clean, leaked: false });
  });

  it('does not blank common English words that happen to be romaji', () => {
    const hidden = [{ surface: '鮫', readings: ['さめ'] }];
    expect(redact('It means the same as shark.', hidden)).toEqual({
      text: 'It means the same as shark.',
      leaked: false,
    });
  });

  it('blanks a one-kana reading only when it stands alone', () => {
    const hidden = [{ surface: '目', readings: ['め'] }];
    expect(redact('Say め here; ためる stays.', hidden).text).toBe(
      `Say ${HIDDEN_MARK} here; ためる stays.`,
    );
  });

  it('keeps a kana word the sentence shows whole, and still blanks the reading (D89)', () => {
    const sentence = 'お祭りで友達を待つ。まつりはたのしい。';
    const reply = 'まつり means festival; おまつり is polite. Here you まつ your friend.';
    expect(redactReadings(reply, MATTE, sentence)).toEqual({
      text: `まつり means festival; おまつり is polite. Here you ${HIDDEN_MARK} your friend.`,
      leaked: true,
    });
  });

  it('still blanks a kana word the sentence does not show (D89)', () => {
    expect(redactReadings('まつり means festival.', MATTE).text).toBe(
      `${HIDDEN_MARK}り means festival.`,
    );
    const shown = '友達を＿＿＿ください。';
    expect(redactReadings('まってください is polite.', MATTE, shown).text).toBe(
      `${HIDDEN_MARK}ください is polite.`,
    );
  });

  it('does nothing without hidden targets', () => {
    expect(redactReadings('まって', [])).toEqual({ text: 'まって', leaked: false });
  });

  it('lists long-vowel romaji spellings', () => {
    expect(romajiForms(SHOUKAI)).toEqual(
      expect.arrayContaining(['shoukai', 'shōkai', 'shookai', 'shokai']),
    );
  });
});

describe('spoilsReading', () => {
  it('flags a hidden reading and any word sharing a hidden kanji', () => {
    expect(spoilsReading({ surface: '待って', reading: 'まって' }, MATTE)).toBe(true);
    expect(spoilsReading({ surface: '待合室', reading: 'まちあいしつ' }, MATTE)).toBe(true);
    expect(spoilsReading({ surface: 'ほか', reading: 'まつ' }, MATTE)).toBe(true);
    expect(spoilsReading({ surface: '駅', reading: 'えき' }, MATTE)).toBe(false);
  });
});
