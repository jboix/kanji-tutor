import { describe, expect, it } from 'vitest';
import { sha256Hex, stableJson } from './hash.ts';

describe('stableJson', () => {
  it('sorts keys at every level and drops undefined fields', () => {
    expect(stableJson({ b: 1, a: { d: [{ z: 1, y: 2 }], c: undefined } })).toBe(
      '{"a":{"d":[{"y":2,"z":1}]},"b":1}',
    );
  });
});

describe('sha256Hex', () => {
  it('matches the standard test vector', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('hashes UTF-8 Japanese text', async () => {
    expect(await sha256Hex('紹介')).not.toBe(await sha256Hex('紹介 '));
  });
});
