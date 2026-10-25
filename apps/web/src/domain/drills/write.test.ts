import { describe, expect, it } from 'vitest';
import { S, W } from '../../test/reading-fixtures.ts';
import type { Sentence } from '../types.ts';
import { gradeExercise } from './exercise-grade.ts';
import type { WriteDrill } from './types.ts';
import { blankedWord, kanjiToDraw, writeDrill } from './write.ts';

const target = (sentence: Sentence, tokenIndex: number, readings: string[]) => {
  const token = sentence.tokens[tokenIndex];
  return { tokenIndex, wordId: token?.wordId ?? '', surface: token?.surface ?? '', readings };
};

const student = () =>
  writeDrill({
    sentence: S.student,
    target: target(S.student, 0, ['がくせい']),
    word: W.gakusei,
  }) as WriteDrill;

describe('Write the kanji', () => {
  it('blanks a word of the sentence, with its reading, meaning and kanji to draw', () => {
    const drill = student();
    expect(drill).toMatchObject({
      kind: 'write',
      at: 0,
      wordId: W.gakusei.id,
      itemId: `word:${W.gakusei.id}`,
      word: { written: '学生', reading: 'がくせい' },
      kanji: ['学', '生'],
      readings: ['がくせい'],
      meaning: { glosses: ['student'] },
    });
    expect(drill.typed).toBeUndefined();
  });

  it('keeps the kana of a word as the sentence writes it (待っ → 〇っ)', () => {
    const drill = writeDrill({
      sentence: S.waiting,
      target: target(S.waiting, 4, ['まっ']),
      word: W.matsu,
    });
    expect(drill?.kanji).toEqual(['待']);
    expect(drill?.at).toBe(S.waiting.text.indexOf('待'));
    expect(blankedWord('待っ', '〇')).toBe('〇っ');
  });

  it('leaves out words without kanji, with 々, or with more than three kanji', () => {
    const kana = { ...S.student, tokens: [{ ...S.student.tokens[0], surface: 'がくせい' }] };
    expect(
      writeDrill({
        sentence: kana as Sentence,
        target: target(kana as Sentence, 0, ['がくせい']),
        word: W.gakusei,
      }),
    ).toBeUndefined();
    expect(kanjiToDraw('人々')).toEqual([]);
    expect(kanjiToDraw('日本語学校')).toHaveLength(5);
  });

  it('leaves out a target that does not match its token', () => {
    const wrong = { ...target(S.student, 0, ['がくせい']), surface: '先生' };
    expect(writeDrill({ sentence: S.student, target: wrong, word: W.gakusei })).toBeUndefined();
  });

  it('grades a drawing by the kanji read, in order', () => {
    const drill = student();
    expect(gradeExercise(drill, '学生').verdict).toBe('correct');
    expect(gradeExercise(drill, '学牛')).toMatchObject({ verdict: 'wrong', given: '学牛' });
    expect(gradeExercise(drill, 'がくせい').verdict).toBe('wrong');
    expect(gradeExercise(drill, '', true)).toMatchObject({ skipped: true, expected: '学生' });
  });

  it('grades the typed twin by its reading, in kana or romaji, or the word as written', () => {
    const drill: WriteDrill = { ...student(), typed: true };
    expect(gradeExercise(drill, 'がくせい').verdict).toBe('correct');
    expect(gradeExercise(drill, 'gakusei').verdict).toBe('correct');
    expect(gradeExercise(drill, '学生').verdict).toBe('correct');
    expect(gradeExercise(drill, 'せんせい').verdict).toBe('wrong');
  });
});
