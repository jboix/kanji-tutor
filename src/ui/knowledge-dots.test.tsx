import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { translator } from '../test/i18n.ts';
import { inLanguage } from '../test/render.tsx';
import { KnowledgeDots, LEVEL_LABELS } from './knowledge-dots.tsx';

describe('KnowledgeDots', () => {
  it.each([0, 1, 2, 3, 4] as const)('names level %i in plain words', (level) => {
    render(<KnowledgeDots level={level} />);
    const dots = screen.getByRole('img', { name: translator()(LEVEL_LABELS[level]) });
    expect(dots.children).toHaveLength(4);
  });

  it('says when a reading is often misread', () => {
    render(<KnowledgeDots level={1} misread />);
    expect(screen.getByRole('img', { name: 'Recognized, often misread' })).toBeDefined();
  });

  it('names levels in the learner language', () => {
    render(inLanguage(<KnowledgeDots level={2} />, 'es'));
    expect(screen.getByRole('img', { name: 'Conoce el significado' })).toBeDefined();
  });

  it('takes a custom label', () => {
    render(<KnowledgeDots level={3} label="Reads it in familiar words like 生きる" />);
    expect(
      screen.getByRole('img', { name: 'Reads it in familiar words like 生きる' }),
    ).toBeDefined();
  });
});
