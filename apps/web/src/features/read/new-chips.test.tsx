import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { SessionCard } from '../../domain/session-types.ts';
import { readingRepos, S } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { Slots } from '../../ui/slots.tsx';
import { NewChips } from './new-chips.tsx';

const slots: Slots = {
  grammarIntro: ({ grammarId, onDone }) => (
    <button type="button" onClick={onDone}>
      Intro of {grammarId}
    </button>
  ),
};

describe('New grammar chips (L7, L8)', () => {
  it('opens the grammar intro in a sheet and records the point as introduced', async () => {
    const repos = await readingRepos();
    const card: SessionCard = {
      sentence: S.came,
      targets: [],
      reason: 'new',
      newGrammar: ['desu'],
    };
    renderWithServices(<NewChips card={card} />, { services: fakeServices({ repos }), slots });
    await userEvent.click(await screen.findByRole('button', { name: 'New grammar: 〜です' }));
    const sheet = await screen.findByRole('dialog', { name: 'New grammar: 〜です' });
    await userEvent.click(within(sheet).getByRole('button', { name: 'Intro of desu' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(async () => expect(await repos.items.get('grammar:desu')).toBeDefined());
  });

  it('shows nothing for a card with no new grammar and no target', async () => {
    const card: SessionCard = { sentence: S.came, targets: [], reason: 'new' };
    const view = renderWithServices(<NewChips card={card} />, {
      services: fakeServices({ repos: await readingRepos() }),
      slots,
    });
    expect(view.container.textContent).toBe('');
  });
});
