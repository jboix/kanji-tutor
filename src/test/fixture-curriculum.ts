/** The fixture pack's units, clusters and grammar in memory repos, for curriculum tests (T3, V1). */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import type { Repos, Store } from '../domain/repos.ts';
import type { Cluster, GrammarPoint, UnitPack } from '../domain/types.ts';
import { fixtureRepos } from './fixture-pack.ts';

const DIR = resolve(import.meta.dirname, '../../public/packs/fixture');

function load<T>(file: string): T[] {
  return JSON.parse(gunzipSync(readFileSync(resolve(DIR, file))).toString('utf8')) as T[];
}

/** The packs' stores in memory repos also take writes (see `createMemoryRepos`). */
function writable<T>(store: unknown): Store<T> {
  return store as Store<T>;
}

/** Fixture repos with the units, clusters and grammar packs installed too. */
export async function curriculumRepos(): Promise<Repos> {
  const repos = await fixtureRepos();
  await writable<UnitPack>(repos.units).putMany(load<UnitPack>('units-00.json.gz'));
  await writable<Cluster>(repos.clusters).putMany(load<Cluster>('clusters-00.json.gz'));
  await repos.grammar.putMany(load<GrammarPoint>('grammar-00.json.gz'));
  return repos;
}
