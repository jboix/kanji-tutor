import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AiClient } from '../../ai/types.ts';
import { ANSWER, noKey, ok } from '../../test/explain-results.ts';
import { S } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { AskBox } from './ask-box.tsx';

function render(ai: Partial<AiClient>) {
  const services = fakeServices({ ai: fakeAi(ai) });
  renderWithServices(<AskBox sentence={S.waiting} />, { services });
  return { field: screen.getByLabelText('Ask about this sentence'), services };
}

function show(ai: Partial<AiClient>) {
  return render(ai).field;
}

describe('AskBox', () => {
  it('answers a question about the sentence and keeps only the last answer', async () => {
    const answerQuestion = vi
      .fn()
      .mockReturnValueOnce(ok(ANSWER))
      .mockReturnValueOnce(ok({ answer: 'Because of 間に.', readings: [] }));
    const field = show({ answerQuestion });
    await userEvent.type(field, 'What does 間に do?{Enter}');
    const note = await screen.findByRole('note', { name: 'Answer' });
    expect(note.textContent).toContain('marks a point inside a stretch of time');
    expect(screen.getByText(/You asked/).textContent).toBe('You asked: What does 間に do?');
    expect(answerQuestion).toHaveBeenCalledWith({
      scope: 'sentence',
      sentence: { text: S.waiting.text, translation: S.waiting.translation },
      question: 'What does 間に do?',
    });
    expect((field as HTMLInputElement).value).toBe('');
    await userEvent.type(field, 'Why?{Enter}');
    expect(await screen.findByText('Because of')).toBeTruthy();
    expect(screen.getAllByRole('note')).toHaveLength(1);
  });

  it('offers simpler, one more example and keep under the answer', async () => {
    const followUp = vi.fn(() => ok({ text: 'It means while.', readings: [] }));
    const { field, services } = render({ answerQuestion: () => ok(ANSWER), followUp });
    await userEvent.type(field, 'What does 間に do?{Enter}');
    const note = await screen.findByRole('note', { name: 'Answer' });
    const labels = within(note)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'));
    expect(labels).toEqual([
      'Simpler, please, 1 request, uses AI',
      `One more with ${S.waiting.text}, 1 request, uses AI`,
      'Keep in my notes',
    ]);
    await userEvent.click(within(note).getByRole('button', { name: /^Simpler, please, / }));
    expect((await screen.findByRole('note', { name: 'Follow-up' })).textContent).toContain(
      'It means while.',
    );
    expect(followUp).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'simpler', previous: ANSWER.answer }),
    );
    await userEvent.click(within(note).getByRole('button', { name: 'Keep in my notes' }));
    expect(await screen.findByText('Kept in your notes.')).toBeTruthy();
    const [kept] = await services.repos.notes.all();
    expect(kept).toMatchObject({ body: ANSWER.answer, sentenceId: S.waiting.id });
  });

  it('marks unverified readings in the answer', async () => {
    const readings = [{ surface: '間', reading: 'ま', verified: false }];
    const field = show({ answerQuestion: () => ok({ ...ANSWER, readings }) });
    await userEvent.type(field, 'Reading?{Enter}');
    expect(await screen.findByText('unverified')).toBeTruthy();
  });

  it('points to Settings without a key', async () => {
    const field = show({ answerQuestion: noKey });
    await userEvent.type(field, 'Reading?{Enter}');
    expect(await screen.findByRole('link', { name: 'Settings' })).toBeTruthy();
  });
});
