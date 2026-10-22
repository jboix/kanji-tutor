import { describe, expect, it } from 'vitest';
import { gunzip, gzip, sha256 } from './gzip.ts';

describe('the save on the wire', () => {
  it('gzips and back, and is far smaller for JSON', async () => {
    const text = JSON.stringify({
      reviews: Array.from({ length: 500 }, (_, i) => ({ at: i, answer: 'まって' })),
    });
    const packed = await gzip(text);
    expect(packed.byteLength).toBeLessThan(new TextEncoder().encode(text).byteLength / 5);
    expect(await gunzip(packed)).toBe(text);
  });

  it('hashes text as SHA-256 hex', async () => {
    expect(await sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});
