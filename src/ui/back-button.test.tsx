import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, Link, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import { BackButton } from './back-button.tsx';

function app(initialEntries: string[]) {
  const page = (name: string, next?: string) => () => (
    <main>
      <h1>{name}</h1>
      <BackButton parent="/" label="Back" />
      {next && <Link to={next}>next</Link>}
    </main>
  );
  const router = createMemoryRouter(
    [
      { path: '/', Component: page('Today', '/units') },
      { path: '/units', Component: page('Units', '/units/a') },
      { path: '/units/a', Component: page('Unit A') },
    ],
    { initialEntries },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('BackButton (S1)', () => {
  it('steps back through the history, one screen at a time', async () => {
    const router = app(['/']);
    await userEvent.click(screen.getByRole('link', { name: 'next' }));
    await userEvent.click(await screen.findByRole('link', { name: 'next' }));
    expect(await screen.findByRole('heading', { name: 'Unit A' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('heading', { name: 'Units' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('heading', { name: 'Today' })).toBeTruthy();
    expect(router.state.historyAction).toBe('POP');
  });

  it('replaces a page opened directly with its parent, without pushing', async () => {
    const router = app(['/units/a']);
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByRole('heading', { name: 'Today' })).toBeTruthy();
    expect(router.state.historyAction).toBe('REPLACE');
  });
});
