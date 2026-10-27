import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Repos } from '../../domain/repos.ts';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { KanjiScreen } from './kanji-screen.tsx';
import { KanjiWallScreen } from './kanji-wall-screen.tsx';

function render(repos: Repos, path = '/kanji/wall') {
  return renderWithServices(
    <Routes>
      <Route path="/kanji/wall" element={<KanjiWallScreen />} />
      <Route path="/kanji/:char" element={<KanjiScreen />} />
    </Routes>,
    { services: fakeServices({ repos }), path },
  );
}

async function withReadings() {
  const repos = await curriculumRepos();
  await repos.kanjiReadings.putMany([
    { id: '日:ひ', kanji: '日', reading: 'ひ', level: 3, wordIds: [] },
    { id: '一:イチ', kanji: '一', reading: 'イチ', level: 1, wordIds: [] },
  ]);
  return repos;
}

describe('the kanji wall screen', () => {
  it("tiles the learner's level with each kanji's state, and how many they read", async () => {
    render(await withReadings());
    expect(
      await screen.findByRole('heading', { name: /Your kanji wall · 1 you read/ }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: '日: You read it' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '一: Learning' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '国: Not yet' })).toBeTruthy();
    expect(screen.getByRole<HTMLInputElement>('radio', { name: 'N5' }).checked).toBe(true);
  });

  it('rings the kanji the current unit teaches', async () => {
    render(await withReadings());
    const ringed = await screen.findByRole('link', { name: '学: Not yet, the one you are on' });
    expect(ringed.getAttribute('aria-current')).toBe('true');
    expect(screen.getAllByRole('link', { current: true })).toHaveLength(1);
  });

  it("opens on a kanji page's level with that kanji ringed", async () => {
    render(await withReadings(), '/kanji/wall?at=%E6%97%A5&level=5');
    const ringed = await screen.findByRole('link', { current: true });
    expect(ringed.getAttribute('aria-label')).toBe('日: You read it, the one you are on');
  });

  it('switches level, and a tile opens its kanji', async () => {
    const user = userEvent.setup();
    render(await withReadings());
    await screen.findByRole('link', { name: '日: You read it' });
    await user.click(screen.getByRole('radio', { name: 'N4' }));
    expect(await screen.findByRole('heading', { name: /0 you read/ })).toBeTruthy();
    const list = screen.getByRole('list');
    await user.click(within(list).getAllByRole('link')[0] as HTMLElement);
    expect(await screen.findByRole('heading', { level: 1 })).toBeTruthy();
  });

  it('shows the wall around a kanji on its page, with a way to the whole wall', async () => {
    render(await withReadings(), '/kanji/日');
    const glimpse = await screen.findByRole('region', { name: 'Your kanji wall' });
    expect(within(glimpse).getAllByRole('link', { name: /^.: / }).length).toBeLessThanOrEqual(21);
    const ringed = within(glimpse).getByRole('link', { current: true });
    expect(ringed.getAttribute('aria-label')).toBe('日: You read it, the one you are on');
    const all = within(glimpse).getByRole('link', { name: /^All \d+$/ });
    expect(all.getAttribute('href')).toBe('/kanji/wall?at=%E6%97%A5&level=5');
  });
});
