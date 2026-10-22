// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { emailCode, inviteCode, pairingCode } from '../src/tokens.ts';

/** How often each character comes up over many codes, made with `make`. */
function counts(make: () => string, times: number): Map<string, number> {
  const seen = new Map<string, number>();
  for (let i = 0; i < times; i++)
    for (const c of make().replace('-', '')) seen.set(c, (seen.get(c) ?? 0) + 1);
  return seen;
}

describe('codes', () => {
  it('have their shapes', () => {
    expect(pairingCode()).toMatch(/^[A-HJKMNP-Z2-9]{3}-[A-HJKMNP-Z2-9]{3}$/);
    expect(inviteCode()).toMatch(/^[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
    expect(emailCode()).toMatch(/^\d{6}$/);
  });

  // With a modulo, 8 of the 31 letters came up about 14% more often, and digits 0–5 of the email
  // code slightly more than 6–9. Drawn again instead, every one is within a few percent.
  it('use every letter and digit equally often', () => {
    for (const [make, size] of [
      [inviteCode, 31],
      [emailCode, 10],
    ] as const) {
      const seen = counts(make, 20_000);
      expect(seen.size).toBe(size);
      const mean = [...seen.values()].reduce((a, b) => a + b) / size;
      for (const n of seen.values()) expect(Math.abs(n - mean) / mean).toBeLessThan(0.06);
    }
  });
});
