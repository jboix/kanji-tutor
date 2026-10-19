import { describe, expect, it } from 'vitest';
import type { CorrectionMark } from '../../ai/index.ts';
import { markSegments } from './mark-segments.ts';

const MOCKUP = '日本語が嫌いわけではないが、漢字を書くのは好きじゃない。';

function mark(
  kind: CorrectionMark['kind'],
  start: number,
  end: number,
  text = '',
  severity: CorrectionMark['severity'] = 'error',
): CorrectionMark {
  return { kind, severity, start, end, text, title: `${kind} ${start}`, note: '' };
}

/** Compact view: plain text as is, marks as [kind:original>insert]. */
function view(text: string, marks: CorrectionMark[]): string {
  return markSegments(text, marks)
    .segments.map((s) => {
      if (s.kind === 'plain') return s.text;
      const insert = s.kind === 'insert' || s.kind === 'replace' ? `>${s.insert}` : '';
      return `[${s.kind}:${s.text}${insert}]`;
    })
    .join('');
}

describe('markSegments', () => {
  it.each<[string, string, CorrectionMark[], string]>([
    ['no marks', 'ABC', [], 'ABC'],
    [
      'は over が, not over 犬 (regression)',
      '私が犬はあまり好きじゃない',
      [mark('replace', 1, 2, 'は'), mark('replace', 3, 4, 'が')],
      '私[replace:が>は]犬[replace:は>が]あまり好きじゃない',
    ],
    [
      'the mockup: insert な and a style note',
      MOCKUP,
      [mark('insert', 6, 6, 'な'), mark('replace', 21, 27, '好きではない', 'style')],
      '日本語が嫌い[insert:>な]わけではないが、漢字を書くのは[style:好きじゃない]。',
    ],
    ['insert at the start', '本だ', [mark('insert', 0, 0, 'こ')], '[insert:>こ]本だ'],
    ['insert at the end', '本だ', [mark('insert', 2, 2, '。')], '本だ[insert:>。]'],
    ['error replace', '本を読みる', [mark('replace', 2, 5, '読む')], '本を[replace:読みる>読む]'],
    ['error delete', '本をを読む', [mark('delete', 2, 3)], '本を[delete:を]読む'],
    ['style delete', 'とても本だ', [mark('delete', 0, 3, '', 'style')], '[style:とても]本だ'],
    ['style insert stays a caret', '本だ', [mark('insert', 1, 1, 'X', 'style')], '本[insert:>X]だ'],
    [
      'unsorted marks are ordered',
      'ABCD',
      [mark('delete', 3, 4), mark('delete', 0, 1)],
      '[delete:A]BC[delete:D]',
    ],
    [
      'insert before a range at the same offset',
      'ABC',
      [mark('replace', 1, 2, 'x'), mark('insert', 1, 1, 'y')],
      'A[insert:>y][replace:B>x]C',
    ],
    ['out of range dropped', 'ABC', [mark('delete', 2, 9), mark('insert', -1, -1, 'x')], 'ABC'],
    [
      'malformed dropped',
      'ABC',
      [
        mark('insert', 0, 2, 'x'),
        mark('replace', 1, 1, 'x'),
        mark('replace', 0, 1, ''),
        mark('delete', 2, 1),
        mark('delete', 0.5, 1),
      ],
      'ABC',
    ],
    [
      'overlap: the earlier mark wins',
      'ABCDE',
      [mark('delete', 0, 3), mark('replace', 2, 4, 'x'), mark('insert', 1, 1, 'y')],
      '[delete:ABC]DE',
    ],
    [
      'two carets at one offset keep the first',
      'AB',
      [mark('insert', 1, 1, 'x'), mark('insert', 1, 1, 'y')],
      'A[insert:>x]B',
    ],
    ['surrogate pair kept whole', '𠮟る人', [mark('replace', 0, 2, '叱')], '[replace:𠮟>叱]る人'],
    [
      'offset inside a surrogate pair dropped',
      '𠮟る',
      [mark('insert', 1, 1, 'x'), mark('delete', 0, 1)],
      '𠮟る',
    ],
  ])('%s', (_name, text, marks, expected) => {
    expect(view(text, marks)).toBe(expected);
  });

  it('indexes kept marks in sentence order', () => {
    const late = mark('delete', 3, 4);
    const early = mark('insert', 0, 0, 'x');
    const { segments, marks } = markSegments('ABCD', [late, mark('delete', 9, 10), early]);
    expect(marks).toEqual([early, late]);
    expect(segments.flatMap((s) => (s.kind === 'plain' ? [] : [s.mark]))).toEqual([0, 1]);
    expect(segments.map((s) => s.start)).toEqual([0, 0, 3]);
  });
});
