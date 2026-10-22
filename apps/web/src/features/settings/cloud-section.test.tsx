import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { fakeCloud } from '../../test/fake-cloud.ts';
import { fakeServices, renderWithServices } from '../../test/render.tsx';
import { CloudSection } from './cloud-section.tsx';

const open = (cloud: ReturnType<typeof fakeCloud>) =>
  renderWithServices(<CloudSection />, { services: fakeServices({ cloud }) });

describe('Settings → Cloud saves', () => {
  it('offers to turn on, or to log in, when off', () => {
    open(fakeCloud());
    expect(screen.getByRole('link', { name: 'Turn on' }).getAttribute('href')).toBe('/cloud/join');
    expect(screen.getByRole('link', { name: 'Log in instead' }).getAttribute('href')).toBe(
      '/log-in',
    );
  });

  it('shows where the save stands, and saves now', async () => {
    const cloud = fakeCloud({ signedIn: true, status: 'offline' });
    open(cloud);
    expect(screen.getByRole('status').textContent).toMatch(/Offline/);
    await userEvent.click(screen.getByRole('button', { name: 'Save now' }));
    expect(cloud.saveNow).toHaveBeenCalled();
  });

  it('lists the devices, this one first, and signs another out after asking', async () => {
    const cloud = fakeCloud({ signedIn: true });
    open(cloud);
    const list = await screen.findByRole('list');
    const rows = await within(list).findAllByRole('listitem');
    expect(rows[0]?.textContent).toMatch(/iPhone · This device/);
    fireEvent.click(within(list).getByRole('button', { name: 'Sign out' }));
    expect(screen.getByText(/Sign out “Laptop”\?/)).toBeTruthy();
    await userEvent.click(
      within(list).getAllByRole('button', { name: 'Sign out' })[0] as HTMLElement,
    );
    expect(cloud.removeDevice).toHaveBeenCalledWith('b');
  });

  it('links a device once its name is seen, the code typed any way', async () => {
    const cloud = fakeCloud({ signedIn: true });
    open(cloud);
    await userEvent.type(screen.getByLabelText('Code on the new device'), 'k7f29q');
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(cloud.peekLink).toHaveBeenCalledWith('K7F-29Q');
    expect(await screen.findByText('“Chrome on Windows” asks to use your progress.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Let it in' }));
    expect(cloud.approveLink).toHaveBeenCalledWith('K7F-29Q');
    expect(await screen.findByText(/Linked: “Chrome on Windows”/)).toBeTruthy();
  });

  it('sets the recovery email with the code sent to it', async () => {
    const cloud = fakeCloud({ signedIn: true });
    open(cloud);
    expect(await screen.findByText(/None yet/)).toBeTruthy();
    await userEvent.type(screen.getByLabelText('Email address'), 'me@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Send a code' }));
    await userEvent.type(await screen.findByLabelText('Code from the email'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(cloud.confirmEmail).toHaveBeenCalledWith('123456');
    expect(await screen.findByText('Codes go to me@example.com.')).toBeTruthy();
  });

  it('logs out only after asking', async () => {
    const cloud = fakeCloud({ signedIn: true });
    open(cloud);
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(cloud.logOut).not.toHaveBeenCalled();
    expect(screen.getByText(/Its progress stays here/)).toBeTruthy();
    await userEvent.click(screen.getAllByRole('button', { name: 'Log out' })[1] as HTMLElement);
    expect(cloud.logOut).toHaveBeenCalled();
  });
});
