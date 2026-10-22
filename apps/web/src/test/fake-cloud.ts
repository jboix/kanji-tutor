/** A cloud port in memory, for screens that use cloud saves. */
import { vi } from 'vitest';
import type { CloudPort, CloudState } from '../domain/cloud.ts';

const ok = <T>(value: T) => ({ ok: true as const, value });

export function fakeCloud(state: Partial<CloudState> = {}, overrides: Partial<CloudPort> = {}) {
  const current: CloudState = { signedIn: false, status: 'saved', ...state };
  const cloud: CloudPort = {
    state: () => current,
    subscribe: () => () => undefined,
    turnOn: vi.fn(async () => ok(undefined)),
    logInWithPasskey: vi.fn(async () => ok(undefined)),
    startLink: vi.fn(async () => ok({ code: 'K7F-29Q', expiresIn: 120 })),
    waitForLink: vi.fn(() => new Promise<never>(() => undefined)),
    sendLogInCode: vi.fn(async () => ok(undefined)),
    logInWithCode: vi.fn(async () => ok(undefined)),
    peekLink: vi.fn(async () => ok({ name: 'Chrome on Windows' })),
    approveLink: vi.fn(async () => ok(undefined)),
    email: vi.fn(async () => ok(null)),
    addEmail: vi.fn(async () => ok(undefined)),
    confirmEmail: vi.fn(async () => ok(undefined)),
    addPasskey: vi.fn(async () => ok(undefined)),
    devices: vi.fn(async () =>
      ok([
        { id: 'a', name: 'iPhone', createdAt: 1, lastSeen: Date.UTC(2026, 9, 20), current: true },
        { id: 'b', name: 'Laptop', createdAt: 1, lastSeen: Date.UTC(2026, 9, 1), current: false },
      ]),
    ),
    removeDevice: vi.fn(async () => ok(undefined)),
    saveNow: vi.fn(async () => undefined),
    logOut: vi.fn(async () => ok(undefined)),
    deleteAccount: vi.fn(async () => ok(undefined)),
    ...overrides,
  };
  return cloud;
}
