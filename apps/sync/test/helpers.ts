import { newDevice } from '../src/sessions.ts';
import type { TestDeps } from './fakes.ts';

/** An account with one signed-in device, as after turning on cloud saves. */
export async function signedInAccount(deps: TestDeps, name = 'iPhone') {
  const accountId = `account-${deps.store.accounts.size + 1}`;
  await deps.store.createAccount({ id: accountId, email: null, createdAt: deps.now() });
  const { token, device } = await newDevice(deps, accountId, name);
  return { accountId, token, device };
}
