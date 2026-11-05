import { describe, expect, it } from 'vitest';
import type { Word } from '../types.ts';
import { cuesOf } from './exercise-material.ts';

const word = (forms: string[], reading: string, pos: string[]): Word => ({
  id: forms[0] ?? reading,
  forms,
  readings: [reading],
  glosses: [],
  common: true,
  pos,
});

describe('cuesOf', () => {
  it('gives a verb its class', () => {
    expect(cuesOf(word(['行く'], 'いく', ['v5k-s']))).toEqual([
      { written: '行く', reading: 'いく', wordId: '行く', cls: 'v5k-s' },
    ]);
  });

  it('makes a の or な adjective a noun cue, never a verb (近く is not 近きます)', () => {
    expect(cuesOf(word(['近く'], 'ちかく', ['n', 'adj-no', 'adv']))).toEqual([
      { written: '近く', reading: 'ちかく', wordId: '近く' },
    ]);
    expect(cuesOf(word(['便利'], 'べんり', ['adj-na', 'n']))).toEqual([
      { written: '便利', reading: 'べんり', wordId: '便利' },
    ]);
  });

  it('drops a な adjective that is not a noun', () => {
    expect(cuesOf(word(['好き'], 'すき', ['adj-na']))).toEqual([]);
  });
});
