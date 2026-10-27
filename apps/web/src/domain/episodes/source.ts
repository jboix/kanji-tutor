/**
 * The episodes as written in the data files: each title and line one `|`-separated string, so
 * the files stay short. A title is English, French and Spanish; a line is the speaker's cast id,
 * the Japanese, then English, French and Spanish.
 */
import { CAST, type CastId } from '../cast.ts';
import type { DialogueText } from '../dialogues/types.ts';
import type { Episode, EpisodeLine } from './types.ts';

export interface EpisodeSource {
  unitId: string;
  /** "en|fr|es". */
  title: string;
  cast: readonly CastId[];
  /** "speaker|ja|en|fr|es", the speaker a cast id. */
  lines: readonly string[];
}

const fields = (row: string) => row.split('|').map((field) => field.trim());

function texts([en = '', fr = '', es = '']: readonly string[]): DialogueText {
  return { en, fr, es };
}

function lineOf(row: string): EpisodeLine {
  const [by = '', ja = '', ...tr] = fields(row);
  const member = CAST.find((m) => m.id === by);
  if (!member) throw new Error(`Unknown speaker "${by}" in: ${row}`);
  return { by: member.id, ja, tr: texts(tr) };
}

/** An episode from its written form; an unknown speaker throws as the data loads. */
export function episode(source: EpisodeSource): Episode {
  return {
    unitId: source.unitId,
    title: texts(fields(source.title)),
    cast: source.cast,
    lines: source.lines.map(lineOf),
  };
}
