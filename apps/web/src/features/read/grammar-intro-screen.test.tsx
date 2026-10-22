import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { grammarIntroCard } from '../../domain/services/grammar-intro.ts';
import { readingRepos, S } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import type { GrammarIntroSlotProps } from '../../ui/slots.tsx';
import { GrammarIntroScreen } from './grammar-intro-screen.tsx';
import { INITIAL, sessionReducer } from './session-state.ts';

function Intro({ grammarId, onDone }: GrammarIntroSlotProps) {
  return (
    <button type="button" onClick={onDone}>
      Got it {grammarId}
    </button>
  );
}

describe('grammar introductions in a session (G4)', () => {
  it('shows the slot, records the point on Got it and moves on', async () => {
    const repos = await readingRepos();
    const onDone = vi.fn();
    renderWithServices(<GrammarIntroScreen grammarId="te-iru" topBar={null} onDone={onDone} />, {
      services: fakeServices({ repos }),
      slots: { grammarIntro: Intro },
    });
    await userEvent.click(screen.getByRole('button', { name: 'Got it te-iru' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect((await repos.items.get('grammar:te-iru'))?.kind).toBe('grammar');
  });

  it('passes the card over without the slot', async () => {
    const onDone = vi.fn();
    renderWithServices(<GrammarIntroScreen grammarId="te-iru" topBar={null} onDone={onDone} />);
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });

  it('steps past an introduction card only', () => {
    const reading = { sentence: S.came, targets: [], reason: 'new' as const };
    const cards = [grammarIntroCard('te-iru'), reading];
    const loaded = sessionReducer(INITIAL, { type: 'loaded', cards, at: 1 });
    const after = sessionReducer(loaded, { type: 'introduced', at: 2 });
    expect(after).toMatchObject({ index: 1, shownAt: 2, drills: [] });
    expect(sessionReducer(after, { type: 'introduced', at: 3 })).toBe(after);
  });
});
