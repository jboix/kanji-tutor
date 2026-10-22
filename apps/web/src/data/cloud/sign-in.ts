import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { type CloudApi, CloudError } from './api.ts';
import { createPasskey, signWithPasskey } from './passkey.ts';

/** How often a device waiting to be linked asks whether it was approved. */
export const LINK_POLL_MS = 2500;

type Registration = { challengeId: string; options: PublicKeyCredentialCreationOptionsJSON };
type Authentication = { challengeId: string; options: PublicKeyCredentialRequestOptionsJSON };

/**
 * A passkey for this device: for a new account with `invite`, or, signed in, one more for the
 * account. A new account answers with this device's session token.
 */
export async function registerPasskey(api: CloudApi, name: string, invite?: string) {
  const { challengeId, options } = await api.post<Registration>(
    '/passkey/register/options',
    invite === undefined ? {} : { invite },
  );
  const response = await createPasskey(options);
  return api.post<{ token?: string }>('/passkey/register/verify', { challengeId, name, response });
}

/** Signs in with any passkey of this site: the session token. */
export async function passkeyToken(api: CloudApi, name: string): Promise<string> {
  const { challengeId, options } = await api.post<Authentication>('/passkey/login/options');
  const response = await signWithPasskey(options);
  const { token } = await api.post<{ token: string }>('/passkey/login/verify', {
    challengeId,
    name,
    response,
  });
  return token;
}

export interface PendingLink {
  code: string;
  secret: string;
  expiresAt: number;
}

const pause = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    const stop = () => {
      clearTimeout(timer);
      resolve();
    };
    signal.addEventListener('abort', stop, { once: true });
  });

/** Asks until the signed-in device approves (the token), the code expires, or `signal` aborts. */
export async function linkToken(
  api: CloudApi,
  link: PendingLink,
  signal: AbortSignal,
  now: () => number,
): Promise<string | undefined> {
  while (!signal.aborted) {
    if (now() > link.expiresAt) throw new CloudError('code-expired');
    const claim = await api.post<{ status: string; token?: string }>('/pair/claim', {
      code: link.code,
      secret: link.secret,
    });
    if (claim.token) return claim.token;
    await pause(LINK_POLL_MS, signal);
  }
  return undefined;
}
