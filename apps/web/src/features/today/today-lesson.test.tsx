import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { newWordItem } from '../../domain/services/items.ts';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { withJlptIndex } from '../../test/jlpt-index.ts';
import { ALL_WORDS, NOW, readingRepos } from '../../test/reading-fixtures.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { TodayScreen } from './today-screen.tsx';

/** A few known words, so Today shows its body rather than the first run. */
async function knowSome(repos: Awaited<ReturnType<typeof curriculumRepos>>) {
  const words = ALL_WORDS.slice(0, 3);
  await repos.items.putMany(
    words.map((w) => newWordItem({ wordId: w.id, kind: 'import', now: NOW, level: 3 })),
  );
}

describe('Today and the lesson path (T3, P4)', { timeout: 20_000 }, () => {
  it('shows the current unit as Next up, with its sections (IA2)', async () => {
    const repos = await curriculumRepos();
    renderWithServices(<TodayScreen />, { services: fakeServices({ repos }) });
    const next = await screen.findByRole('region', { name: 'Next up' });
    expect(next.textContent).toContain('Next up · unit 1');
    const title = within(next).getByRole('link', { name: 'わたしは学生です' });
    expect(title.getAttribute('href')).toBe('/units/i-am-a-student');
    const sections = within(next).getByRole('list', { name: 'Sections' });
    expect(within(sections).getAllByRole('listitem')).toHaveLength(5);
    expect(sections.querySelector('[aria-current="step"]')?.textContent).toContain('言葉');
    expect(next.textContent).toContain('言葉 · Words, part 1, about 5 minutes');
  });

  it('marks the sections done, and Continue opens the next part', async () => {
    const repos = await curriculumRepos();
    await knowSome(repos);
    await repos.settings.patch({
      unitStatus: {
        'i-am-a-student': {
          introducedAt: NOW,
          sections: { words: { parts: 1, done: 1, at: NOW - 3 * 86_400_000 } },
        },
      },
    });
    renderWithServices(<TodayScreen />, { services: fakeServices({ repos }) });
    const next = await screen.findByRole('region', { name: 'Next up' });
    expect(within(next).getByText('Words, done')).toBeTruthy();
    expect(within(next).getByText('Grammar, next')).toBeTruthy();
    const go = within(next).getByRole('link', { name: /^Continue\s?文法 · Grammar, part 1/ });
    expect(go.getAttribute('href')).toBe('/read?unit=i-am-a-student&section=grammar&part=1');
  });

  it('suggests moving up at 80% known, and moves only when asked', async () => {
    const repos = withJlptIndex(await readingRepos({ learnerLevel: 5 }));
    const n5 = ALL_WORDS.filter((w) => w.jlpt === 5 && w.forms.length > 0);
    await repos.items.putMany(
      n5.map((w) => newWordItem({ wordId: w.id, kind: 'import', now: NOW, level: 3 })),
    );
    renderWithServices(<TodayScreen />, { services: fakeServices({ repos }) });
    const row = await screen.findByRole('region', { name: 'Your level' });
    expect(row.textContent).toContain('You know 100% of N5. Move to N4?');
    expect((await repos.settings.get()).learnerLevel).toBe(5);
    await userEvent.click(screen.getByRole('button', { name: 'Move to N4' }));
    await waitFor(async () => expect((await repos.settings.get()).learnerLevel).toBe(4));
  });

  it('hides the suggestion after Not now', async () => {
    const repos = withJlptIndex(await readingRepos({ learnerLevel: 5 }));
    const n5 = ALL_WORDS.filter((w) => w.jlpt === 5 && w.forms.length > 0);
    await repos.items.putMany(
      n5.map((w) => newWordItem({ wordId: w.id, kind: 'import', now: NOW, level: 3 })),
    );
    renderWithServices(<TodayScreen />, { services: fakeServices({ repos }) });
    await userEvent.click(await screen.findByRole('button', { name: 'Not now' }));
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Your level' })).toBeNull());
    expect((await repos.settings.get()).learnerLevel).toBe(5);
  });
});
