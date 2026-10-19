import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createAiClient } from '../../ai/client.ts';
import { createMockProvider } from '../../ai/providers/mock.ts';
import { testContext } from '../../ai/testing/context.ts';
import type { Sentence } from '../../domain/types.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { ExplainWordSheet } from './word-sheet.tsx';

/** 友達は日本人です。 hand-tokenized; token 2 is 日本人. */
const SENTENCE: Sentence = {
  id: 's-nihonjin',
  text: '友達は日本人です。',
  source: 'tatoeba',
  verified: true,
  wordIds: [],
  tokens: [
    { surface: '友達', reading: 'ともだち', base: '友達', pos: 'noun', start: 0 },
    { surface: 'は', reading: 'は', base: 'は', pos: 'particle', start: 2 },
    { surface: '日本人', reading: 'にほんじん', base: '日本人', pos: 'noun', start: 3 },
    { surface: 'です', reading: 'です', base: 'です', pos: 'auxiliary', start: 6 },
    { surface: '。', reading: '', base: '。', pos: 'symbol', start: 8 },
  ],
} as Sentence;

describe('a less common reading from the tutor (R10, D57)', () => {
  it('marks にっぽんじん inside the AI box and names にほんじん', async () => {
    const ai = createAiClient(async () => testContext({ provider: createMockProvider() }));
    renderWithServices(
      <ExplainWordSheet sentence={SENTENCE} tokenIndex={2} onClose={() => undefined} />,
      { services: fakeServices({ ai }) },
    );
    const sheet = screen.getByRole('dialog', { name: '日本人 in this sentence' });
    await userEvent.click(
      within(sheet).getByRole('button', { name: /^Ask the tutor about this word, / }),
    );
    const note = await within(sheet).findByRole('note', { name: 'The tutor on 日本人' });
    expect(note.textContent).toContain(
      'Less common reading にっぽんじん for 日本人: the usual one is にほんじん.',
    );
    expect(note.closest('[data-ai-block]') ?? note.hasAttribute('data-ai-block')).toBeTruthy();
  });
});
