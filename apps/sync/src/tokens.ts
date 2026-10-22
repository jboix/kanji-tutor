/** Random tokens and codes, and the hashes kept in place of tokens. */

const CODE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');

/** 32 random bytes, base64url: a session token or a pairing secret. */
export function randomToken(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

/** A random id for rows and challenges. */
export const randomId = (): string => crypto.randomUUID();

/** "K7F-29Q": a pairing code that is easy to read out and type, without 0/O or 1/I/L. */
export function pairingCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const letters = [...bytes].map((b) => CODE_LETTERS[b % CODE_LETTERS.length]).join('');
  return `${letters.slice(0, 3)}-${letters.slice(3)}`;
}

/** "KD7M-3XQP": an invite code, read out or sent in a link; 8 letters, about 39 bits. */
export function inviteCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const letters = [...bytes].map((b) => CODE_LETTERS[b % CODE_LETTERS.length]).join('');
  return `${letters.slice(0, 4)}-${letters.slice(4)}`;
}

/** An invite code as typed, compared without case, spaces or dashes. */
export const normalInvite = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** A 6-digit email code, with leading zeros. */
export function emailCode(): string {
  const [n = 0] = crypto.getRandomValues(new Uint32Array(1));
  return String(n % 1_000_000).padStart(6, '0');
}

/** SHA-256 of a string, hex. */
export async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Bytes as base64url, and back (passkey public keys are stored so). */
export const toBase64url = base64url;

export function fromBase64url(text: string): Uint8Array<ArrayBuffer> {
  const base64 = text.replaceAll('-', '+').replaceAll('_', '/');
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
