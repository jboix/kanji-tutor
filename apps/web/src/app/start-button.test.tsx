import { fireEvent, render, screen, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Repos } from '../domain/repos.ts';
import { StartScreen } from '../features/start/start-screen.tsx';
import { TodayScreen } from '../features/today/today-screen.tsx';
import { curriculumRepos } from '../test/fixture-curriculum.ts';
import { knowBasics, readingRepos, track, W } from '../test/reading-fixtures.ts';
import { fakeServices, inLanguage } from '../test/render.tsx';
import { ServicesProvider } from '../ui/services.tsx';
import { takeSession } from '../ui/session-handoff.ts';

/** The session route: where Start went, and how many cards Today handed on. */
function ReadProbe() {
  const { search, state } = useLocation();
  const cards = takeSession(state, Date.now());
  return (
    <p>
      {`read${search}`} {cards ? `handed ${cards.length} cards` : 'built here'}
    </p>
  );
}

function app(repos: Repos, initialEntries = ['/']) {
  const router = createMemoryRouter(
    [
      { path: '/', Component: TodayScreen },
      { path: '/start', Component: StartScreen },
      { path: '/read', Component: ReadProbe },
    ],
    { initialEntries },
  );
  render(
    <ServicesProvider value={fakeServices({ repos })}>
      {inLanguage(<RouterProvider router={router} />)}
    </ServicesProvider>,
  );
  return router;
}

describe('the Start button (IA3)', { timeout: 20_000 }, () => {
  it('opens the sheet, and Daily mix plays the session Today built (N10)', async () => {
    const repos = await readingRepos();
    await knowBasics(repos);
    await track(repos, [[W.matsu, 2]]);
    const router = app(repos);
    expect(await screen.findByRole('link', { name: /^Daily mix\s?\d+ sentences?/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Start a round' }));
    const sheet = await screen.findByRole('dialog', { name: 'What now?' });
    fireEvent.click(await within(sheet).findByRole('button', { name: /^Daily mix/ }));
    const read = await screen.findByText(/^read handed \d+ cards$/);
    expect(read.textContent).not.toContain('handed 0 cards');
    expect(router.state.historyAction).toBe('PUSH');
    await router.navigate(-1);
    expect(
      await screen.findByRole('heading', { name: /^(おはようございます|こんにちは|こんばんは)$/ }),
    ).toBeTruthy();
  });

  it('offers the next lesson part first in the sheet', async () => {
    const repos = await curriculumRepos();
    app(repos);
    fireEvent.click(await screen.findByRole('button', { name: 'Start a round' }));
    const sheet = await screen.findByRole('dialog', { name: 'What now?' });
    const lesson = await within(sheet).findByRole('button', {
      name: /^Continue the lesson\s?言葉/,
    });
    expect(within(sheet).getAllByRole('button', { name: /^(?!Close)/ })[0]).toBe(lesson);
    fireEvent.click(lesson);
    expect(
      await screen.findByText(/^read\?unit=i-am-a-student&section=words&part=1 built here$/),
    ).toBeTruthy();
  });

  it('plays the next unit lesson part first for a learner on the path', async () => {
    const repos = await curriculumRepos();
    app(repos, ['/start']);
    expect(
      await screen.findByText(/^read\?unit=i-am-a-student&section=words&part=1 built here$/),
    ).toBeTruthy();
  });

  it('follows the choice saved on Today', async () => {
    const repos = await readingRepos({ practice: 'reading' });
    app(repos, ['/start']);
    expect(await screen.findByText('read?only=reading built here')).toBeTruthy();
  });
});
