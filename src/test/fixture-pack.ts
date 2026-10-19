/** The e2e fixture pack (public/packs/fixture), loaded into memory repos for property tests. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { Repos } from '../domain/repos.ts';
import type { Kanji, KnowledgeLevel, Sentence, Word } from '../domain/types.ts';
import { createFakeDictionary } from '../lang/testing/fake-dictionary.ts';
import { withJlptIndex } from './jlpt-index.ts';
import { createMemoryRepos } from './memory-repos.ts';

const DIR = resolve(import.meta.dirname, '../../public/packs/fixture');

function load<T>(file: string): T[] {
  return JSON.parse(gunzipSync(readFileSync(resolve(DIR, file))).toString('utf8')) as T[];
}

export interface FixturePack {
  words: Word[];
  kanji: Kanji[];
  sentences: Sentence[];
}

let cached: FixturePack | undefined;

/** The fixture pack's words, kanji and sentences. */
export function fixturePack(): FixturePack {
  cached ??= {
    words: load<Word>('words-00.json.gz'),
    kanji: load<Kanji>('kanji-00.json.gz'),
    sentences: load<Sentence>('sentences-00.json.gz'),
  };
  return cached;
}

/** Memory repos over the fixture pack, with the JLPT indexes and its sentences stored. */
export async function fixtureRepos(): Promise<Repos> {
  const pack = fixturePack();
  const repos = createMemoryRepos({ dictionary: createFakeDictionary(pack.words, pack.kanji) });
  withJlptIndex(repos, pack.words, pack.kanji);
  await repos.sentences.putMany(pack.sentences);
  return repos;
}

/** Every fixture word at `level`: a learner who reads them all. */
export function allLevels(level: KnowledgeLevel = 3): Map<string, KnowledgeLevel> {
  return new Map(fixturePack().words.map((w) => [w.id, level]));
}
