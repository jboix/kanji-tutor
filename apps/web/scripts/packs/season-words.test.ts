import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { SEASON_WORDS } from '../../src/domain/season-words.ts';

const PACKS = resolve(import.meta.dirname, '..', '..', 'public', 'packs');
const MANIFEST = join(PACKS, 'manifest.json');

interface PackWord {
  forms: string[];
  readings: string[];
}

/** The published pack's words, read the way the app installs them. */
function packWords(): PackWord[] {
  const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8')) as {
    files: { store: string; url: string }[];
  };
  return manifest.files
    .filter((file) => file.store === 'words')
    .flatMap((file) => JSON.parse(gunzipSync(readFileSync(join(PACKS, file.url))).toString()));
}

describe.skipIf(!existsSync(MANIFEST))('the words of the season in the published pack', () => {
  it('finds every season word with its reading, so Home can show it', () => {
    const words = packWords();
    const missing = SEASON_WORDS.filter(
      ({ written, reading }) =>
        !words.some((w) => w.forms.includes(written) && w.readings.includes(reading)),
    ).map((w) => w.written);
    expect(missing).toEqual([]);
  });
});
