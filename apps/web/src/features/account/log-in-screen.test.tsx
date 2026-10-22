import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeCloud } from '../../test/fake-cloud.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { LogInScreen } from './log-in-screen.tsx';

const reopened = vi.hoisted(() => vi.fn());
vi.mock('../../ui/use-cloud-action.ts', async (load) => ({
  ...(await load<typeof import('../../ui/use-cloud-action.ts')>()),
  reopenApp: reopened,
}));

function open(cloud = fakeCloud()) {
  renderWithServices(<LogInScreen />, { path: '/log-in', services: fakeServices({ cloud }) });
  return cloud;
}

describe('LogInScreen', () => {
  it('offers the three ways in, and goes back to the welcome', () => {
    open();
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeTruthy();
    for (const name of [/^Link from your phone/, /^Use a passkey/, /^Email me a code/]) {
      expect(screen.getByRole('button', { name })).toHaveProperty('disabled', false);
    }
    expect(screen.getByRole('button', { name: 'Back to the welcome' })).toBeTruthy();
  });

  it('shows the code to type on the other device, and lists the ways again', async () => {
    const cloud = open();
    fireEvent.click(screen.getByRole('button', { name: /^Link from your phone/ }));
    expect(await screen.findByText('K7F-29Q')).toBeTruthy();
    expect(screen.getByText('Waiting for the other device…')).toBeTruthy();
    expect(cloud.waitForLink).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Other ways in' }));
    expect(screen.getByRole('button', { name: /^Use a passkey/ })).toBeTruthy();
  });

  it('logs in with a passkey and starts the app again on the progress', async () => {
    const cloud = open();
    fireEvent.click(screen.getByRole('button', { name: /^Use a passkey/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Use my passkey' }));
    expect(cloud.logInWithPasskey).toHaveBeenCalled();
    expect(reopened).toHaveBeenCalled();
  });

  it('logs in with an emailed code, and says why a code failed', async () => {
    const cloud = open(
      fakeCloud(
        {},
        {
          logInWithCode: vi.fn(async () => ({ ok: false as const, error: 'code-wrong' as const })),
        },
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /^Email me a code/ }));
    await userEvent.type(screen.getByLabelText('Your recovery email'), 'me@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send the code' }));
    expect(cloud.sendLogInCode).toHaveBeenCalledWith('me@example.com');
    await userEvent.type(await screen.findByLabelText('Code from the email'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(cloud.logInWithCode).toHaveBeenCalledWith(
      'me@example.com',
      '123456',
      expect.any(String),
    );
    expect((await screen.findByRole('alert')).textContent).toMatch(/not right/);
  });

  it('reads in French and Spanish', () => {
    const services = fakeServices({ cloud: fakeCloud() });
    const { unmount } = renderWithServices(<LogInScreen />, { language: 'fr', services });
    expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeTruthy();
    unmount();
    renderWithServices(<LogInScreen />, { language: 'es', services });
    expect(screen.getByRole('button', { name: /^Usar una llave de acceso/ })).toBeTruthy();
  });
});
