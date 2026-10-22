import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { CloudError } from './api.ts';

/**
 * The device's passkey prompts (Face ID, Windows Hello, a password manager), through
 * @simplewebauthn/browser, which loads only when one is needed. Closing the prompt is
 * `passkey-cancelled`.
 */
async function prompt<T>(run: (webauthn: typeof import('@simplewebauthn/browser')) => Promise<T>) {
  const webauthn = await import('@simplewebauthn/browser');
  try {
    return await run(webauthn);
  } catch (error) {
    const name = error instanceof Error ? error.name : '';
    throw new CloudError(name === 'NotAllowedError' ? 'passkey-cancelled' : 'passkey-refused');
  }
}

export const createPasskey = (
  options: PublicKeyCredentialCreationOptionsJSON,
): Promise<RegistrationResponseJSON> =>
  prompt((webauthn) => webauthn.startRegistration({ optionsJSON: options }));

export const signWithPasskey = (
  options: PublicKeyCredentialRequestOptionsJSON,
): Promise<AuthenticationResponseJSON> =>
  prompt((webauthn) => webauthn.startAuthentication({ optionsJSON: options }));
