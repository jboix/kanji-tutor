/** Placement in the U5/U6 sweep: no word opens, and the help bar hides the meaning. */
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { PlacementQuestion } from '../../domain/placement/index.ts';
import { readingRepos, S } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { Slots } from '../../ui/slots.tsx';
import { PlacementQuestionView } from './placement-question.tsx';

const slots: Slots = { wordSheet: () => <div role="dialog">sheet</div> };

const item: PlacementQuestion = {
  kind: 'grammar-form',
  level: 4,
  question: {
    id: 'q:grammar-form',
    kind: 'grammar-form',
    section: '問題',
    stem: { before: S.waiting.text.slice(0, 17), target: 'ました', after: '。', mark: 'blank' },
    options: ['ました', 'ません', 'ます', 'ましょう'].map((text) => ({ text, note: text })),
    answer: 0,
    translation: 'I read while waiting.',
    hint: 'I read while ___.',
  },
};

describe('placement (U5, U6)', () => {
  it('opens no word, and shows the meaning only on a press', async () => {
    const services = fakeServices({ repos: await readingRepos() });
    renderWithServices(
      <PlacementQuestionView item={item} index={1} total={10} busy={false} onChoose={() => {}} />,
      { services, slots },
    );
    expect(document.querySelector('[data-word]')).toBeNull();
    expect(document.querySelector('[data-exercise-help]')).toBeTruthy();
    expect(screen.queryByText('I read while ___.')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Show meaning' }));
    // A blank shows its masked meaning only, never the full translation.
    expect(screen.getByText('I read while ___.')).toBeTruthy();
    expect(screen.queryByText('I read while waiting.')).toBeNull();
    expect(screen.getByRole('button', { name: "I don't know" })).toBeTruthy();
  });
});
