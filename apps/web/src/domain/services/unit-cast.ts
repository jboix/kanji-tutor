/**
 * Who a unit meets: its episode's cast, else the cast members who speak in the dialogues of its
 * grammar points, in cast order. Empty when neither has anyone from the cast.
 */
import { CAST, type CastMember, castAmong } from '../cast.ts';
import { loadDialogues } from '../dialogues/index.ts';
import { type Episode, loadEpisodes } from '../episodes/index.ts';
import type { Unit } from '../themes/types.ts';

/** The unit's episode, if it has one. */
export async function unitEpisode(unitId: string): Promise<Episode | undefined> {
  return (await loadEpisodes()).get(unitId);
}

export async function unitCast(unit: Pick<Unit, 'id' | 'grammar'>): Promise<CastMember[]> {
  const episode = await unitEpisode(unit.id);
  if (episode) return CAST.filter((member) => episode.cast.includes(member.id));
  const sets = await loadDialogues();
  const speakers = unit.grammar.flatMap(
    (id) => sets.get(id)?.dialogues.flatMap((dialogue) => dialogue.speakers) ?? [],
  );
  return castAmong(speakers);
}
