import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { readingRepos, S } from '../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../test/render.tsx';
import { SLOTS } from './slots.tsx';

describe('slot wiring', () => {
  it('fills every teach slot (L1, L2, L3, L5)', () => {
    for (const name of [
      'newItemIntro',
      'teachingCard',
      'targetHint',
      'sentenceHelp',
      'sentenceWrapUp',
    ] as const) {
      expect(SLOTS[name], name).toBeTypeOf('function');
    }
  });

  it('loads the teach feature lazily on first render', async () => {
    const WrapUp = SLOTS.sentenceWrapUp;
    if (!WrapUp) throw new Error('not wired');
    const sentence = { ...S.waiting, translation: 'While I waited, I read.' };
    const services = fakeServices({ repos: await readingRepos() });
    renderWithServices(<WrapUp sentence={sentence} />, { services });
    // The lazy chunk can take over a second on a loaded machine.
    const translation = await screen.findByText('“While I waited, I read.”', {}, { timeout: 5000 });
    expect(translation).toBeTruthy();
  });

  it('loads the grammar intro lazily (G4)', async () => {
    const Intro = SLOTS.grammarIntro;
    if (!Intro) throw new Error('not wired');
    renderWithServices(<Intro grammarId="te-mo-ii" onDone={() => undefined} />);
    expect(await screen.findByRole('region', { name: 'New grammar: 〜てもいい' })).toBeTruthy();
  });
});
