import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { AiClient } from '../../ai/types.ts';
import { offline, ok, WORD } from '../../test/explain-results.ts';
import { readingRepos, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { ReadingHook } from './reading-hook.tsx';

async function show(ai: Partial<AiClient>, wordIds = [W.issho.id]) {
  const services = fakeServices({ ai: fakeAi(ai), repos: await readingRepos() });
  renderWithServices(<ReadingHook kanji="生" reading="ショウ" wordIds={wordIds} />, { services });
  await userEvent.click(screen.getByRole('button', { name: /^Show a memory hook, / }));
}

const HOOK = 'You already read 一緒 as いっしょ. 一生 is いっしょう.';

describe('ReadingHook', () => {
  it('fetches a hook only when asked, from a word that carries the reading', async () => {
    const explainWord = vi.fn(() =>
      ok({
        ...WORD,
        hook: HOOK,
        readings: [{ surface: '一緒', reading: 'いっしょ', verified: false }],
      }),
    );
    await show({ explainWord });
    const note = await screen.findByRole('note', { name: 'Memory hook' });
    expect(note.textContent).toContain('You already read 一緒 as いっしょ.');
    expect(note.textContent).toContain('unverified');
    expect(explainWord).toHaveBeenCalledWith({
      sentence: { text: '一生' },
      surface: '一生',
      wordId: W.issho.id,
      word: { form: '一生', reading: 'いっしょう', meanings: ['gloss of 一生'] },
    });
  });

  it('says so when there is no hook', async () => {
    await show({ explainWord: () => ok(WORD) });
    expect(await screen.findByText('No memory hook for this reading yet.')).toBeTruthy();
  });

  it('says so when no word carries the kanji', async () => {
    await show({}, [W.eki.id]);
    expect(await screen.findByText('No memory hook for this reading yet.')).toBeTruthy();
  });

  it('is calm offline', async () => {
    await show({ explainWord: offline });
    expect(
      await screen.findByText(
        "You're offline. Explanations need a connection; the rest of this page still works.",
      ),
    ).toBeTruthy();
  });
});
