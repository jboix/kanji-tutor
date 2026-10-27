import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { EPISODES } from '../../domain/episodes/catalogue.ts';
import { readingRepos } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { EpisodeCard } from './episode-card.tsx';
import { EpisodeScreen } from './episode-screen.tsx';

const FIRST = EPISODES.find((e) => e.unitId === 'i-am-a-student');

async function render(path: string) {
  return renderWithServices(
    <Routes>
      <Route path="/units/:id/episode" element={<EpisodeScreen />} />
      <Route path="/card" element={<EpisodeCard unitId="i-am-a-student" />} />
    </Routes>,
    { services: fakeServices({ repos: await readingRepos() }), path },
  );
}

describe('a unit episode', () => {
  it('shows the chat with each speaker named, the companion on the right', async () => {
    await render('/units/i-am-a-student/episode');
    expect(await screen.findByRole('heading', { name: FIRST?.title.en ?? '' })).toBeTruthy();
    const chat = screen.getByRole('list', { name: /^Chat: / });
    const lines = within(chat).getAllByRole('listitem');
    expect(lines).toHaveLength(FIRST?.lines.length ?? 0);
    const mine = lines.filter((line) => line.hasAttribute('data-mine'));
    const kenLines = FIRST?.lines.filter((line) => line.by === FIRST.cast[0]).length;
    expect(mine).toHaveLength(kenLines ?? 0);
    expect(chat.textContent).toContain(FIRST?.lines[0]?.ja);
  });

  it('shows the translations on request', async () => {
    await render('/units/i-am-a-student/episode');
    const english = FIRST?.lines[0]?.tr.en ?? '';
    await screen.findByRole('list', { name: /^Chat: / });
    expect(screen.queryByText(english)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Show translation' }));
    expect(screen.getByText(english)).toBeTruthy();
  });

  it('says so for a unit without one', async () => {
    await render('/units/nowhere/episode');
    expect(await screen.findByText('This unit has no chat yet.')).toBeTruthy();
  });

  it('opens from its card on the unit page', async () => {
    await render('/card');
    const card = await screen.findByRole('link', { name: new RegExp(FIRST?.title.en ?? '') });
    expect(card.getAttribute('href')).toBe('/units/i-am-a-student/episode');
  });
});
