/** Seeded, deterministic choices for drills: the same inputs and seed give the same drill. */

/** FNV-1a hash of a string. */
export function hashText(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h;
}

/** The values in an order fixed by the seed: stable for the same seed, shuffled across seeds. */
export function seededOrder<T>(values: readonly T[], key: (value: T) => string, seed: string): T[] {
  const ranked = values.map((value) => ({ value, rank: hashText(`${seed}|${key(value)}`) }));
  return ranked.sort((a, b) => a.rank - b.rank).map(({ value }) => value);
}
