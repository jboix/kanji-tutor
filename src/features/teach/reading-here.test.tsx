import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Sentence } from '../../domain/types.ts';
import { renderWithServices } from '../../test/render.tsx';
import { TeachingContent } from './teaching-content.tsx';
import { readingHere, type WordTeaching } from './word-teaching.ts';

const HI = { forms: ['日'], readings: ['ひ', 'にち'] };
const sentence = (surface: string, reading: string): Pick<Sentence, 'tokens'> => ({
  tokens: [{ surface, reading, base: surface, pos: 'noun', start: 0 }],
});

describe('the reading this sentence gives the word (R15)', () => {
  it('takes the token’s reading when the dictionary lists it, else the usual one', () => {
    const card = (s: Pick<Sentence, 'tokens'>) => ({ sentence: s as Sentence });
    expect(readingHere(card(sentence('日', 'にち')), { tokenIndex: 0 }, HI)).toBe('にち');
    expect(readingHere(card(sentence('日', 'じつ')), { tokenIndex: 0 }, HI)).toBe('ひ');
    expect(readingHere(card(sentence('日々', 'ひび')), { tokenIndex: 0 }, HI)).toBe('ひ');
    expect(readingHere({}, { tokenIndex: -1 }, HI)).toBe('ひ');
  });

  it('shows "Here: にち · usually: ひ" under the heading, only with readings', () => {
    const teaching: WordTeaching = {
      wordId: '1',
      surface: '日',
      reading: 'にち',
      usual: 'ひ',
      ruby: [{ text: '日', reading: 'にち' }],
      meanings: ['day'],
      meaningsInEnglish: false,
      kanji: [],
      why: [],
      hooks: [],
    };
    const view = renderWithServices(<TeachingContent teaching={teaching} readings hook={null} />);
    const line = screen.getByText(/Here:/);
    expect(line.textContent).toBe('Here: にち · usually: ひ');
    expect(line.querySelectorAll('[lang="ja"]')).toHaveLength(2);
    expect(view.container.querySelector('rt')?.textContent).toBe('にち');
    view.unmount();
    renderWithServices(<TeachingContent teaching={teaching} readings={false} hook={null} />);
    expect(screen.queryByText(/Here:/)).toBeNull();
  });
});
