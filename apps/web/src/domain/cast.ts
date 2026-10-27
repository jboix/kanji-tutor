/**
 * The cast: three people who come back across the app's dialogues, so a learner meets friends
 * rather than strangers. Yuki and Ken are friends who meet in plain Japanese; Mori-san is older
 * and speaks politely. Other speakers stay guests, shown by their initial.
 */

export type CastId = 'yuki' | 'ken' | 'mori';

export interface CastMember {
  id: CastId;
  /** As a dialogue names them, e.g. "ユキ". */
  speaker: string;
  /** In the interface, e.g. "Yuki", "Mori-san". */
  name: string;
}

/** In the order they are shown together. */
export const CAST: readonly CastMember[] = [
  { id: 'yuki', speaker: 'ユキ', name: 'Yuki' },
  { id: 'ken', speaker: 'ケン', name: 'Ken' },
  { id: 'mori', speaker: '森', name: 'Mori-san' },
];

/** The cast member a dialogue speaker is, if any. */
export function castOf(speaker: string): CastMember | undefined {
  return CAST.find((member) => member.speaker === speaker);
}

/** The cast members among these speakers, in cast order. */
export function castAmong(speakers: Iterable<string>): CastMember[] {
  const names = new Set(speakers);
  return CAST.filter((member) => names.has(member.speaker));
}
