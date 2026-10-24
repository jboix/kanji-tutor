import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fixturePack, fixtureRepos } from '../../test/fixture-pack.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { PlacementRows } from './placement-row.tsx';

const NOW = Date.parse('2026-10-18T09:00:00Z');

describe('Today: level rows (A11)', () => {
  it('offers Find my level to a learner with few reviews', async () => {
    const repos = await fixtureRepos();
    renderWithServices(<PlacementRows now={NOW} />, { services: fakeServices({ repos }) });
    const row = await screen.findByRole('link', { name: /Find my level/ });
    expect(row.getAttribute('href')).toBe('/placement');
    expect(screen.queryByText(/Your reviews suggest/)).toBeNull();
  });

  it('says what the reviews suggest, and leaves the level alone', async () => {
    const repos = await fixtureRepos();
    const words = fixturePack()
      .words.filter((w) => w.jlpt === 5)
      .slice(0, 24);
    for (const [i, word] of words.entries()) {
      await repos.reviews.add({
        at: NOW - i * 60_000,
        itemId: `word:${word.id}`,
        answer: 'x',
        expected: 'x',
        verdict: 'correct',
        durationMs: 1000,
        mode: 'typed',
      });
    }
    renderWithServices(<PlacementRows now={NOW} />, { services: fakeServices({ repos }) });
    expect(await screen.findByText('Your reviews suggest N4')).toBeTruthy();
    expect(screen.getByText('Your level stays N5 until you change it')).toBeTruthy();
    // Find my level stays within reach whatever the reviews say.
    expect(screen.getByRole('link', { name: /^Find my level/ })).toBeTruthy();
    expect((await repos.settings.get()).learnerLevel).toBeUndefined();
  });
});
