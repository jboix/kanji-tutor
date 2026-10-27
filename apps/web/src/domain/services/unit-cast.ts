/**
 * Who a unit meets: the cast members who speak in the dialogues of its grammar points, in cast
 * order. Empty for a unit whose dialogues have only guests, or none (N5).
 */
import { type CastMember, castAmong } from '../cast.ts';
import { loadDialogues } from '../dialogues/index.ts';
import type { Unit } from '../themes/types.ts';

export async function unitCast(unit: Pick<Unit, 'grammar'>): Promise<CastMember[]> {
  const sets = await loadDialogues();
  const speakers = unit.grammar.flatMap(
    (id) => sets.get(id)?.dialogues.flatMap((dialogue) => dialogue.speakers) ?? [],
  );
  return castAmong(speakers);
}
