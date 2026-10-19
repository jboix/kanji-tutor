/** Stable hashing of task inputs for the response cache (A9). */

function compareKeys(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== 'object') return value;
  const entries = Object.entries(value)
    .filter(([, inner]) => inner !== undefined)
    .sort(([a], [b]) => compareKeys(a, b));
  return Object.fromEntries(entries.map(([key, inner]) => [key, sortKeys(inner)]));
}

/** JSON with object keys sorted at every level and `undefined` fields dropped. */
export function stableJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

/** SHA-256 of `text` (UTF-8) as lower-case hex, via Web Crypto. */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
