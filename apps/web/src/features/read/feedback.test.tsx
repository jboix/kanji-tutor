import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { SessionCard } from '../../domain/session-types.ts';
import { renderWithServices } from '../../test/render.tsx';
import { Feedback } from './feedback.tsx';
import type { Answered } from './session-state.ts';

const target = {
  tokenIndex: 0,
  itemId: 'word:1464700' as const,
  wordId: '1464700',
  surface: '日本人',
  readings: ['にほんじん', 'にっぽんじん'],
  variants: ['にっぽんじん'],
};
const card: SessionCard = {
  sentence: {
    id: 's',
    text: '日本人です。',
    source: 'tatoeba',
    tokens: [],
    wordIds: [],
    verified: true,
  },
  targets: [target],
  reason: 'new',
};

function answered(given: string, variantOf?: string): Answered {
  return {
    target,
    answer: given,
    mode: 'typed',
    grade: { verdict: 'correct', expected: given, given, ...(variantOf ? { variantOf } : {}) },
  };
}

describe('Feedback for a variant reading', () => {
  it('says the answer is right and names the more common reading in Klee One', () => {
    renderWithServices(
      <Feedback
        card={card}
        answered={answered('にっぽんじん', 'にほんじん')}
        onOpenWord={() => {}}
      />,
    );
    const note = screen.getByTestId('variant-note');
    expect(note.textContent).toBe('Also correct. にほんじん is the more common reading.');
    expect(note.querySelector('[lang="ja"]')?.textContent).toBe('にほんじん');
  });

  it('adds nothing for the preferred reading', () => {
    renderWithServices(
      <Feedback card={card} answered={answered('にほんじん')} onOpenWord={() => {}} />,
    );
    expect(screen.queryByTestId('variant-note')).toBeNull();
  });

  it('is translated', () => {
    renderWithServices(
      <Feedback
        card={card}
        answered={answered('にっぽんじん', 'にほんじん')}
        onOpenWord={() => {}}
      />,
      { language: 'fr' },
    );
    expect(screen.getByTestId('variant-note').textContent).toBe(
      'Juste aussi. にほんじん est la lecture la plus courante.',
    );
  });
});
