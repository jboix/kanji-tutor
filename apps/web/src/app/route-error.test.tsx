import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { inLanguage } from '../test/render.tsx';
import { RouteError } from './route-error.tsx';
import { reloadOnce } from './stale-chunks.ts';

vi.mock('./stale-chunks.ts', async (original) => ({
  ...(await original<typeof import('./stale-chunks.ts')>()),
  reloadOnce: vi.fn(() => true),
}));

function failWith(message: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/settings',
        lazy: () => Promise.reject(new Error(message)),
        ErrorBoundary: RouteError,
      },
    ],
    { initialEntries: ['/settings'] },
  );
  render(inLanguage(<RouterProvider router={router} />));
}

describe('RouteError', () => {
  afterEach(() => vi.clearAllMocks());

  it('reloads once when the screen chunk of an older build is gone', async () => {
    failWith('Failed to fetch dynamically imported module: /assets/settings-screen-x.js');
    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeTruthy();
    // The reload runs in an effect, just after the error screen renders.
    await waitFor(() => expect(reloadOnce).toHaveBeenCalledTimes(1));
  });

  it('shows the error and a Reload button, without reloading, for any other error', async () => {
    failWith('Cannot read properties of undefined');
    expect(await screen.findByRole('button', { name: 'Reload' })).toBeTruthy();
    expect(reloadOnce).not.toHaveBeenCalled();
  });
});
