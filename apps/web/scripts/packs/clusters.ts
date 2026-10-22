/**
 * Word clusters (V1): within each JLPT level, groups of 5–8 kanji words linked by a shared
 * kanji or by appearing together in pack sentences. Pure and deterministic.
 */
import type { JlptLevel } from '../../src/domain/learner-view.ts';
import type { Cluster, Sentence, Word } from '../../src/domain/types.ts';
import { kanjiWordIds } from './level.ts';

export const CLUSTER_SIZE = { min: 5, max: 8 };
const SHARED_KANJI = 3;
const MAX_COOCCURRENCE = 3;
const LEVELS: JlptLevel[] = [5, 4, 3, 2, 1];
const HAN = /(?![々〆〇])\p{Script=Han}/gu;

interface Graph {
  freq: Map<string, number>;
  kanji: Map<string, string[]>;
  byKanji: Map<string, string[]>;
  cooc: Map<string, Map<string, number>>;
}

function push<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

function addPairs(cooc: Graph['cooc'], ids: string[]): void {
  for (const a of ids) {
    const row = cooc.get(a) ?? new Map<string, number>();
    for (const b of ids) if (a !== b) row.set(b, (row.get(b) ?? 0) + 1);
    cooc.set(a, row);
  }
}

/**
 * Frequency, kanji and co-occurrence of one level's words, from the sentences a learner of that
 * level can meet: N5–N3 sentences for N5–N3 words (an N5 word written in kanji rarely appears in
 * an all-N5 sentence), sentences at or below the level for N2 and N1 words.
 */
function graph(words: Word[], sentences: readonly Sentence[], level: JlptLevel): Graph {
  const ids = new Set(words.map((w) => w.id));
  const floor = Math.min(level, 3);
  const g: Graph = { freq: new Map(), kanji: new Map(), byKanji: new Map(), cooc: new Map() };
  for (const s of sentences) {
    if ((s.level ?? 0) < floor) continue;
    const here = kanjiWordIds(s.tokens).filter((id) => ids.has(id));
    for (const id of here) g.freq.set(id, (g.freq.get(id) ?? 0) + 1);
    addPairs(g.cooc, here);
  }
  for (const w of words) {
    const chars = [...new Set(w.forms[0]?.match(HAN) ?? [])];
    g.kanji.set(w.id, chars);
    for (const c of chars) push(g.byKanji, c, w.id);
  }
  return g;
}

function link(g: Graph, a: string, b: string): number {
  const shared = (g.kanji.get(a) ?? []).filter((c) => g.kanji.get(b)?.includes(c)).length;
  return shared * SHARED_KANJI + Math.min(g.cooc.get(a)?.get(b) ?? 0, MAX_COOCCURRENCE);
}

function neighbours(g: Graph, members: string[], free: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const m of members) {
    for (const c of g.kanji.get(m) ?? []) for (const id of g.byKanji.get(c) ?? []) out.add(id);
    for (const id of g.cooc.get(m)?.keys() ?? []) out.add(id);
  }
  return new Set([...out].filter((id) => free.has(id)));
}

/** The best free word to add: highest total link, then most frequent, then lowest id. */
function best(g: Graph, members: string[], free: Set<string>): string | undefined {
  let pick: { id: string; score: number; freq: number } | undefined;
  for (const id of neighbours(g, members, free)) {
    const score = members.reduce((sum, m) => sum + link(g, id, m), 0);
    const freq = g.freq.get(id) ?? 0;
    const better =
      !pick ||
      score > pick.score ||
      (score === pick.score && (freq > pick.freq || (freq === pick.freq && id < pick.id)));
    if (score > 0 && better) pick = { id, score, freq };
  }
  return pick?.id;
}

function grow(g: Graph, seed: string, free: Set<string>): string[] {
  const members = [seed];
  free.delete(seed);
  while (members.length < CLUSTER_SIZE.max) {
    const next = best(g, members, free);
    if (!next) break;
    members.push(next);
    free.delete(next);
  }
  return members;
}

/** Leftover words (from groups under 5) in frequency order, cut into even groups of 5–8. */
function regroup(words: string[]): string[][] {
  if (words.length === 0) return [];
  const count = Math.ceil(words.length / CLUSTER_SIZE.max);
  const size = Math.ceil(words.length / count);
  const out: string[][] = [];
  for (let i = 0; i < words.length; i += size) out.push(words.slice(i, i + size));
  return out;
}

function byFrequency(g: Graph): (a: string, b: string) => number {
  return (a, b) => (g.freq.get(b) ?? 0) - (g.freq.get(a) ?? 0) || (a < b ? -1 : 1);
}

/** Most frequent first, one word per written form (言う いう and 言う ゆう are one word to learn). */
function seeds(g: Graph, forms: Map<string, string>): string[] {
  const seen = new Set<string>();
  return [...g.freq.keys()].sort(byFrequency(g)).filter((id) => {
    const form = forms.get(id) ?? id;
    if (seen.has(form)) return false;
    seen.add(form);
    return true;
  });
}

function groupsOf(g: Graph, forms: Map<string, string>): string[][] {
  const order = seeds(g, forms);
  const free = new Set(order);
  const groups: string[][] = [];
  const small: string[] = [];
  for (const seed of order) {
    if (!free.has(seed)) continue;
    const members = grow(g, seed, free);
    if (members.length >= CLUSTER_SIZE.min) groups.push(members);
    else small.push(...members);
  }
  return [...groups, ...regroup(small.sort(byFrequency(g)))];
}

/** A kanji written in at least half the words (and three of them), most common first. */
function sharedKanji(g: Graph, members: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const id of members)
    for (const c of g.kanji.get(id) ?? []) counts.set(c, (counts.get(c) ?? 0) + 1);
  const need = Math.max(3, Math.ceil(members.length / 2));
  const [top] = [...counts]
    .filter(([, n]) => n >= need)
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return top?.[0];
}

function toCluster(g: Graph, level: JlptLevel, members: string[], forms: Map<string, string>) {
  const wordIds = [...members].sort(byFrequency(g));
  const kanji = sharedKanji(g, wordIds);
  const first = wordIds[0] ?? '';
  const cluster: Omit<Cluster, 'order'> = {
    id: `c${level}-${first}`,
    level,
    name: kanji ?? forms.get(first) ?? first,
    wordIds,
  };
  if (kanji) cluster.kanji = kanji;
  return cluster;
}

/**
 * Clusters of every level, N5 first, in path order. Only kanji words with a JLPT level that occur
 * in at least one pack sentence a learner of their level can meet take part.
 */
export function buildClusters(words: readonly Word[], sentences: readonly Sentence[]): Cluster[] {
  const forms = new Map(words.map((w) => [w.id, w.forms[0] ?? w.readings[0] ?? w.id]));
  const out: Omit<Cluster, 'order'>[] = [];
  for (const level of LEVELS) {
    const own = words.filter((w) => w.jlpt === level && w.forms.length > 0);
    const g = graph(own, sentences, level);
    out.push(...groupsOf(g, forms).map((members) => toCluster(g, level, members, forms)));
  }
  return out.map((cluster, order) => ({ ...cluster, order }));
}
