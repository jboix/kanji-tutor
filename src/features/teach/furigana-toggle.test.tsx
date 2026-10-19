import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { SessionCard, Target } from '../../domain/session-types.ts';
import { noKey, TARGET } from '../../test/explain-results.ts';
import { readingRepos, S, W } from '../../test/reading-fixtures.ts';
import { fakeAi, fakeServices, renderWithServices } from '../../test/render.tsx';
import { AllFuriganaContext } from '../../ui/furigana-mode.tsx';
import { resetIntroduced } from './intro-once.ts';
import { NewItemIntro } from './new-item-intro.tsx';

/** 間 is the card's second target, still to be read after 待って. */
const AIDA: Target = {
  tokenIndex: 7,
  itemId: `word:${W.aida.id}`,
  wordId: W.aida.id,
  surface: '間',
  readings: ['あいだ'],
};
const CARD: SessionCard = { sentence: S.waiting, targets: [TARGET, AIDA], reason: 'new' };

async function intro(all: boolean) {
  const services = fakeServices({ repos: await readingRepos(), ai: fakeAi({ memoryHook: noKey }) });
  renderWithServices(
    <AllFuriganaContext value={all}>
      <NewItemIntro card={CARD} target={TARGET} onDone={() => undefined} />
    </AllFuriganaContext>,
    { services },
  );
  const card = await screen.findByRole('region', { name: 'New word: 待つ' });
  // The sentence at the top of the card, not the heading under it.
  const sentence = card.querySelector('p[lang="ja"]');
  return [...(sentence?.querySelectorAll('rt') ?? [])].map((rt) => rt.textContent);
}

beforeEach(() => {
  resetIntroduced();
  localStorage.clear();
});

describe('the ふ toggle on the intro card (R12)', () => {
  it('adds furigana to the sentence, but never on a target still to be read', async () => {
    const readings = await intro(true);
    expect(readings).toEqual(['えき', 'ともだち', 'ま', 'ほん', 'よ']);
    expect(readings.filter((r) => r === 'ま')).toHaveLength(1);
    expect(readings).not.toContain('あいだ');
  });

  it('shows only the target’s reading in this sentence with ふ off (R15)', async () => {
    expect(await intro(false)).toEqual(['ま']);
  });

  it('keeps the heading furigana either way', async () => {
    await intro(false);
    const card = screen.getByRole('region', { name: 'New word: 待つ' });
    // The sentence's 待っ and the heading's 待つ.
    expect(within(card).getAllByText('ま', { selector: 'rt' })).toHaveLength(2);
  });
});
