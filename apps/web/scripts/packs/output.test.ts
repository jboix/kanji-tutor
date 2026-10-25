import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { writeManifest } from './emit.ts';
import { keepPrevious } from './output.ts';

describe('keep the previous pack', () => {
  it('moves the current version and its manifest to previous/, replacing an older one', () => {
    const packs = mkdtempSync(join(tmpdir(), 'packs-'));
    const manifest = {
      version: 'v2',
      files: [{ store: 'words' as const, url: 'v2/words-00.json.gz', bytes: 3, count: 1 }],
    };
    mkdirSync(join(packs, 'v2'));
    writeFileSync(join(packs, 'v2', 'words-00.json.gz'), 'abc');
    writeManifest(join(packs, 'manifest.json'), manifest);
    mkdirSync(join(packs, 'previous', 'v1'), { recursive: true });

    keepPrevious(packs);

    expect(existsSync(join(packs, 'v2'))).toBe(false);
    expect(existsSync(join(packs, 'previous', 'v1'))).toBe(false);
    expect(readFileSync(join(packs, 'previous', 'v2', 'words-00.json.gz'), 'utf8')).toBe('abc');
    const moved = JSON.parse(readFileSync(join(packs, 'previous', 'manifest.json'), 'utf8'));
    expect(moved).toEqual(manifest);
  });

  it('does nothing without a current pack', () => {
    const packs = mkdtempSync(join(tmpdir(), 'packs-'));
    keepPrevious(packs);
    expect(existsSync(join(packs, 'previous'))).toBe(false);
  });
});
