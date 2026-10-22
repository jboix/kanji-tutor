import { describe, expect, it } from 'vitest';
import { anchorMark, anchorMarks, type QuotedMark } from './anchor-marks.ts';

function quoted(
  kind: QuotedMark['kind'],
  start: number,
  end: number,
  original: string,
  before: string,
  text = 'X',
): QuotedMark {
  return { kind, severity: 'error', start, end, original, before, text, title: '', note: '' };
}

/** The sentence with the anchored mark's span in brackets, e.g. 私[が]犬は. */
function placed(sentence: string, mark: QuotedMark): string | undefined {
  const at = anchorMark(sentence, mark);
  if (!at) return undefined;
  return `${sentence.slice(0, at.start)}[${sentence.slice(at.start, at.end)}]${sentence.slice(at.end)}`;
}

const INU = '私が犬はあまり好きじゃない';

describe('anchorMark', () => {
  it('puts "Use は instead of が" on が, not on 犬 (the offsets were one too far)', () => {
    const mark = quoted('replace', 2, 3, 'が', '私', 'は');
    expect(placed(INU, mark)).toBe('私[が]犬はあまり好きじゃない');
    expect(anchorMark(INU, mark)).toMatchObject({ start: 1, end: 2, text: 'は' });
    expect(anchorMark(INU, mark)).not.toHaveProperty('original');
  });

  it('finds が without its context, by the offset the model counted', () => {
    expect(placed(INU, quoted('replace', 2, 3, 'が', ''))).toBe('私[が]犬はあまり好きじゃない');
    expect(placed(INU, quoted('replace', 2, 3, 'が', '猫'))).toBe('私[が]犬はあまり好きじゃない');
  });

  it.each<[string, QuotedMark, string]>([
    ['context picks the second が', quoted('replace', 0, 1, 'が', '猫'), '私が猫[が]好き'],
    ['context picks the first が', quoted('replace', 4, 5, 'が', '私'), '私[が]猫が好き'],
    ['no context: the が nearest the offset', quoted('replace', 4, 5, 'が', ''), '私が猫[が]好き'],
    ['no context, a tie: the earlier one', quoted('delete', 2, 3, 'が', ''), '私[が]猫が好き'],
  ])('repeated characters: %s', (_, mark, expected) => {
    expect(placed('私が猫が好き', mark)).toBe(expected);
  });

  it.each<[string, string, QuotedMark, string]>([
    ['replace', '本を読みる', quoted('replace', 3, 6, '読みる', '本を'), '本を[読みる]'],
    ['delete', '本をを読む', quoted('delete', 1, 2, 'を', '本を'), '本を[を]読む'],
    [
      'style',
      '漢字は好きじゃない',
      quoted('replace', 4, 10, '好きじゃない', 'は'),
      '漢字は[好きじゃない]',
    ],
    ['overlapping repeats', 'ははは', quoted('replace', 1, 3, 'はは', 'は'), 'は[はは]'],
  ])('multi-character %s spans keep their length', (_, sentence, mark, expected) => {
    expect(placed(sentence, mark)).toBe(expected);
  });

  it('places an insertion after the text quoted before it', () => {
    const sentence = '日本語が嫌いわけではない';
    expect(placed(sentence, quoted('insert', 7, 7, '', 'が嫌い'))).toBe(
      '日本語が嫌い[]わけではない',
    );
    expect(placed('本だ', quoted('insert', 1, 1, '', '本だ'))).toBe('本だ[]');
  });

  it('keeps the offsets of a mark that quotes nothing, if they fit', () => {
    expect(placed('本だ', quoted('insert', 0, 0, '', ''))).toBe('[]本だ');
    expect(placed('本だ', quoted('replace', 0, 1, '', ''))).toBe('[本]だ');
    expect(placed('本だ', quoted('replace', 1, 5, '', ''))).toBeUndefined();
  });

  it('drops a mark whose quote is not in the sentence', () => {
    expect(anchorMark('短い。', quoted('replace', 0, 2, '好き', 'は'))).toBeUndefined();
    expect(anchorMark('短い。', quoted('insert', 1, 1, '', '嫌い'))).toBeUndefined();
  });

  it('handles characters outside the BMP as two UTF-16 units', () => {
    expect(placed('𠮟るが好き', quoted('replace', 1, 2, 'が', 'る'))).toBe('𠮟る[が]好き');
  });
});

describe('anchorMarks', () => {
  it('anchors each mark and drops the ones it cannot place', () => {
    const marks = [quoted('replace', 2, 3, 'が', '私', 'は'), quoted('delete', 0, 1, '猫', '')];
    expect(anchorMarks(INU, marks)).toEqual([expect.objectContaining({ start: 1, end: 2 })]);
  });
});
