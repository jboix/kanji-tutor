import { describe, expect, it } from 'vitest';
import { K } from '../../test/reading-fixtures.ts';
import type { Kanji } from '../types.ts';
import { gradeExercise } from './exercise-grade.ts';
import { kanjiCardDrill, typedReadings } from './kanji-card.ts';

const kanji = (char: string): Kanji => {
  const found = K.find((k) => k.char === char);
  if (!found) throw new Error(char);
  return found;
};

const card = (char: string, direction: 'read' | 'write', known: string[] = []) =>
  kanjiCardDrill({ kanji: kanji(char), known, direction, others: K, seed: 'a' });

describe('Kanji cards', () => {
  it('counts a dictionary reading typed in kana: on, kun with and without its okurigana', () => {
    expect(typedReadings('セイ')).toEqual(['せい']);
    expect(typedReadings('い.きる')).toEqual(['いきる', 'い']);
    expect(typedReadings('-ぶ')).toEqual(['ぶ']);
  });

  it('reads a kanji: its known readings first, any of its readings right', () => {
    const drill = card('生', 'read', ['ショウ']);
    expect(drill).toMatchObject({ kind: 'kanji-card', kanji: '生', itemId: 'kanji:生' });
    expect(drill?.readings[0]).toBe('ショウ');
    if (!drill) throw new Error('no card');
    expect(gradeExercise(drill, 'shou').verdict).toBe('correct');
    expect(gradeExercise(drill, 'いきる').verdict).toBe('correct');
    expect(gradeExercise(drill, 'なま').verdict).toBe('correct');
    expect(gradeExercise(drill, 'がく')).toMatchObject({ verdict: 'wrong', expected: 'ショウ' });
  });

  it('writes a kanji from its readings, with lookalikes to choose from when typed', () => {
    const drill = card('待', 'write');
    expect(drill?.choices).toHaveLength(4);
    expect(drill?.choices).toContain('待');
    // 持 and 時 share 寺 with 待: they come before kanji that share nothing.
    expect(drill?.choices).toEqual(expect.arrayContaining(['持', '時']));
    if (!drill) throw new Error('no card');
    expect(gradeExercise(drill, '待').verdict).toBe('correct');
    expect(gradeExercise(drill, '持')).toMatchObject({ verdict: 'wrong', expected: '待' });
  });

  it('has no writing card without other kanji to choose from', () => {
    const lone = kanjiCardDrill({
      kanji: kanji('待'),
      known: [],
      direction: 'write',
      others: [kanji('待'), kanji('持')],
      seed: 'a',
    });
    expect(lone).toBeUndefined();
  });
});
