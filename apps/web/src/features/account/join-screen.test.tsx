import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { fakeCloud } from '../../test/fake-cloud.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { JoinScreen } from './join-screen.tsx';

vi.mock('../../ui/use-cloud-action.ts', async (load) => ({
  ...(await load<typeof import('../../ui/use-cloud-action.ts')>()),
  reopenApp: vi.fn(),
}));

const open = (cloud: ReturnType<typeof fakeCloud>, path = '/cloud/join?code=KD7M-3XQP') =>
  renderWithServices(<JoinScreen />, { path, services: fakeServices({ cloud }) });

describe('turning on cloud saves', () => {
  it('takes the code from the invite link, makes a passkey, and says it is on', async () => {
    const cloud = fakeCloud();
    open(cloud);
    expect(screen.getByLabelText('Invite code')).toHaveProperty('value', 'KD7M-3XQP');
    await userEvent.click(screen.getByRole('button', { name: 'Create a passkey and turn on' }));
    expect(cloud.turnOn).toHaveBeenCalledWith('KD7M-3XQP', expect.any(String));
    expect(await screen.findByText(/Cloud saves are on/)).toBeTruthy();
  });

  it('says when the invite does not work', async () => {
    const refused = { ok: false as const, error: 'invite-needed' as const };
    open(fakeCloud({}, { turnOn: vi.fn(async () => refused) }));
    await userEvent.click(screen.getByRole('button', { name: 'Create a passkey and turn on' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/used or revoked/);
  });

  it('says so when this device already saves online', () => {
    open(fakeCloud({ signedIn: true }), '/cloud/join');
    expect(screen.getByText('Cloud saves are already on for this device.')).toBeTruthy();
  });
});
