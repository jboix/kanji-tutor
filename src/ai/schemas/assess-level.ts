import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { LevelAssessment, PlacementLevel } from '../types.ts';
import { readingClaims } from './shared.ts';

/** Raw `assessLevel` reply (A11). */
export const assessLevelSchema = z.object({
  level: z.enum(['N5', 'N4', 'N3']).describe('The JLPT level the learner should work on now.'),
  strengths: z.array(z.string()).describe('Two or three short phrases on what is solid.'),
  gaps: z.array(z.string()).describe('Two or three short phrases on what to work on.'),
  notes: z.string().describe('Two or three plain sentences, with no score and no praise.'),
  readings: readingClaims,
});

const LEVELS: Record<'N5' | 'N4' | 'N3', PlacementLevel> = { N5: 5, N4: 4, N3: 3 };

/** The level as a number; readings in the notes, strengths and gaps checked (A8). */
export async function finalizeAssessment(
  raw: z.output<typeof assessLevelSchema>,
  _input: unknown,
  lang: Verifier,
): Promise<LevelAssessment> {
  const readings = await checkWithProse(lang, raw.readings, raw);
  return { ...raw, level: LEVELS[raw.level], readings };
}
