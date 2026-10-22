import { z } from 'zod';
import { checkWithProse } from '../prose-readings.ts';
import type { Verifier } from '../task-def.ts';
import type { MemoryHook } from '../types.ts';
import { readingClaims } from './shared.ts';

/** Raw `memoryHook` reply (L1, A5). */
export const memoryHookSchema = z.object({
  hook: z.string().describe('One or two sentences tying meaning and reading to known words.'),
  readings: readingClaims,
});

/** Verifies the claimed readings and those written in the prose. */
export async function finalizeMemoryHook(
  raw: z.output<typeof memoryHookSchema>,
  _input: unknown,
  lang: Verifier,
): Promise<MemoryHook> {
  return { ...raw, readings: await checkWithProse(lang, raw.readings, raw) };
}
