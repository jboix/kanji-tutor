import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { LessonCard } from './lesson-card.tsx';
import { PractisedProgress } from './practised-progress.tsx';

const inRouter = (node: ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>);

describe('LessonCard', () => {
  it('links the whole card, with its title, aside, meta and progress line', () => {
    inRouter(
      <LessonCard
        to="/lessons/weather"
        title="Weather and plans"
        aside="Oct 25"
        meta="3 pages · Kanji, grammar, exercises"
        progress={{ done: 6, total: 20 }}
      />,
    );
    const card = screen.getByRole('link', { name: /Weather and plans/ });
    expect(card.getAttribute('href')).toBe('/lessons/weather');
    expect(card.textContent).toContain('Oct 25');
    expect(card.textContent).toContain('3 pages · Kanji, grammar, exercises');
    expect(card.textContent).toContain('6 of 20 practised');
    const bar = within(card).getByRole('progressbar', { name: 'Progress: 6 of 20 practised' });
    expect(bar.getAttribute('aria-valuenow')).toBe('30');
  });

  it('says "Not started" before anything is practised, and opens on click without a route', async () => {
    const open = vi.fn();
    inRouter(<LessonCard title="Particles" progress={{ done: 0, total: 8 }} onClick={open} />);
    const card = screen.getByRole('button', { name: /Particles/ });
    expect(card.textContent).toContain('Not started');
    await userEvent.click(card);
    expect(open).toHaveBeenCalledOnce();
  });

  it('shows a done lesson as all of its items practised, nothing more', () => {
    inRouter(<LessonCard to="/x" title="At the station" progress={{ done: 12, total: 12 }} />);
    const card = screen.getByRole('link');
    expect(card.textContent).toBe('At the station12 of 12 practised');
    expect(within(card).getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
  });
});

describe('PractisedProgress', () => {
  it('shows a started lesson with nothing practised yet as a count', () => {
    render(<PractisedProgress done={0} total={16} started />);
    expect(screen.getByText('0 of 16 practised')).toBeTruthy();
  });

  it('stacks the count in bold over the line, with its aside', () => {
    render(
      <PractisedProgress layout="stacked" done={6} total={20} aside="last practised Oct 26" />,
    );
    expect(screen.getByText('6 of 20 practised')).toBeTruthy();
    expect(screen.getByText('last practised Oct 26')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('30');
  });

  it('keeps an empty lesson at zero', () => {
    render(<PractisedProgress done={0} total={0} started />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });
});
