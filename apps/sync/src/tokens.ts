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

/**
 * `count` characters drawn uniformly from `alphabet` (up to 256): each takes the fewest random
 * bits that cover it, and a value past its end is drawn again, never folded back with a modulo,
 * so no character comes up more often than another.
 */
function randomPicks(alphabet: string, count: number): string {
  const mask = 2 ** Math.ceil(Math.log2(alphabet.length)) - 1;
  let picked = '';
  while (picked.length < count) {
    for (const byte of crypto.getRandomValues(new Uint8Array(count))) {
      const index = byte & mask;
      if (index < alphabet.length && picked.length < count) picked += alphabet[index];
    }
  }
  return picked;
}

/** "K7F-29Q": a pairing code that is easy to read out and type, without 0/O or 1/I/L. */
export function pairingCode(): string {
  const letters = randomPicks(CODE_LETTERS, 6);
  return `${letters.slice(0, 3)}-${letters.slice(3)}`;
}

/** "KD7M-3XQP": an invite code, read out or sent in a link; 8 letters, about 39 bits. */
export function inviteCode(): string {
  const letters = randomPicks(CODE_LETTERS, 8);
  return `${letters.slice(0, 4)}-${letters.slice(4)}`;
}

/** An invite code as typed, compared without case, spaces or dashes. */
export const normalInvite = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** A 6-digit email code, leading zeros included. */
export const emailCode = (): string => randomPicks('0123456789', 6);

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
