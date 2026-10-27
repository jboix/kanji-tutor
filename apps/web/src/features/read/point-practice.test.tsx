import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { curriculumRepos } from '../../test/fixture-curriculum.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { PointPractice } from './point-practice.tsx';

describe('Practise this point (S5)', { timeout: 30_000 }, () => {
  it('runs the point’s drills on the page, then counts them and offers a full session', async () => {
    const repos = await curriculumRepos();
    renderWithServices(<PointPractice grammarId="desu" />, { services: fakeServices({ repos }) });
    const first = await screen.findByText(/^Drill 1 of \d$/);
    const total = Number(first.textContent?.at(-1));
    expect(total).toBeGreaterThanOrEqual(2);
    // The first drill leaves the keyboard shut until the learner starts.
    expect(document.activeElement?.tagName).not.toBe('INPUT');
    for (let at = 1; at <= total; at++) {
      await screen.findByText(`Drill ${at} of ${total}`);
      await userEvent.click(screen.getByRole('button', { name: "I don't know" }));
      const label = at === total ? 'Finish' : 'Next drill';
      await userEvent.click(await screen.findByRole('button', { name: label }));
    }
    expect(await screen.findByText(`0 of ${total} right.`)).toBeTruthy();
    expect((await repos.reviews.all()).filter((r) => r.skipped).length).toBeGreaterThan(0);
    const full = screen.getByRole('link', { name: 'A full session on this point' });
    expect(full.getAttribute('href')).toBe('/read?grammar=desu');
    await userEvent.click(screen.getByRole('button', { name: 'Practise again' }));
    expect(await screen.findByText(`Drill 1 of ${total}`)).toBeTruthy();
  });

  it('offers only the full session for a point without drills', async () => {
    const repos = await curriculumRepos();
    const view = renderWithServices(<PointPractice grammarId="nope" />, {
      services: fakeServices({ repos }),
    });
    await screen.findByText('Choosing drills…');
    await waitFor(() => expect(view.container.textContent).toBe('A full session on this point'));
  });
});
