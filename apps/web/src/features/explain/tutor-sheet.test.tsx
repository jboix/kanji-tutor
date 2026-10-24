import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AiClient } from '../../ai/types.ts';
import { ANSWER, noKey, ok } from '../../test/explain-results.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import type { TutorTopic } from '../../ui/slots.tsx';
import { TutorSheet } from './tutor-sheet.tsx';

const TOPIC: TutorTopic = {
  about: '〜ました',
  sentence: { text: '昨日は映画を見ました。', translation: 'I watched a film yesterday.' },
  grammar: { pattern: '〜ました', meaning: 'polite past' },
};

function render(ai: Partial<AiClient>, first?: string) {
  const client = fakeAi(ai);
  const onClose = vi.fn();
  renderWithServices(
    <TutorSheet
      topic={TOPIC}
      starters={['Why は?', 'The casual form']}
      first={first ? { question: first, client } : undefined}
      onClose={onClose}
    />,
    { services: fakeServices({ ai: client }) },
  );
  return { onClose };
}

describe('TutorSheet', () => {
  it('says what it is about and offers the starters before any question', () => {
    render({});
    expect(screen.getByRole('dialog', { name: 'The tutor, about 〜ました' })).toBeTruthy();
    expect(screen.getByText('Your tutor')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Why は?, 1 request, uses AI' })).toBeTruthy();
  });

  it('keeps every turn and sends the earlier answers with the next question', async () => {
    const answerQuestion = vi
      .fn()
      .mockReturnValueOnce(ok(ANSWER))
      .mockReturnValueOnce(ok({ answer: 'In casual speech, 見た.', readings: [] }));
    render({ answerQuestion });
    await userEvent.click(screen.getByRole('button', { name: /^Why は\?, / }));
    expect(await screen.findByRole('note', { name: 'Answer' })).toBeTruthy();
    expect(answerQuestion).toHaveBeenLastCalledWith({
      scope: 'sentence',
      sentence: TOPIC.sentence,
      grammar: TOPIC.grammar,
      question: 'Why は?',
    });
    await userEvent.type(screen.getByLabelText('Ask the tutor'), 'And casually?{Enter}');
    expect(await screen.findByText(/In casual speech/)).toBeTruthy();
    expect(screen.getAllByRole('note', { name: 'Answer' })).toHaveLength(2);
    expect(answerQuestion).toHaveBeenLastCalledWith(
      expect.objectContaining({
        question: 'And casually?',
        history: [{ question: 'Why は?', answer: ANSWER.answer }],
      }),
    );
    expect(screen.getByRole('button', { name: 'Simpler, 1 request, uses AI' })).toBeTruthy();
  });

  it('asks the question pressed outside it as it opens, once', async () => {
    const answerQuestion = vi.fn(() => ok(ANSWER));
    render({ answerQuestion }, 'The casual form');
    expect(await screen.findByRole('note', { name: 'Answer' })).toBeTruthy();
    expect(answerQuestion).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: /^Why は\?, / })).toBeNull();
  });

  it('says why there is no answer, without losing the question', async () => {
    render({ answerQuestion: () => noKey() }, 'Why は?');
    expect(await screen.findByText(/Gemini key/)).toBeTruthy();
    expect(screen.getByRole('dialog').textContent).toContain('Why は?');
  });
});
