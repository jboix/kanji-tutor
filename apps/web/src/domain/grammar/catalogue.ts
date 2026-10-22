/** The full N5–N3 grammar catalogue (G1), written for this app (D29). */
import { N3_A } from './n3-a.ts';
import { N3_B } from './n3-b.ts';
import { N3_C } from './n3-c.ts';
import { N3_D } from './n3-d.ts';
import { N3_E } from './n3-e.ts';
import { N4_A } from './n4-a.ts';
import { N4_B } from './n4-b.ts';
import { N4_C } from './n4-c.ts';
import { N4_D } from './n4-d.ts';
import { N5_A } from './n5-a.ts';
import { N5_B } from './n5-b.ts';
import { N5_C } from './n5-c.ts';
import type { GrammarEntry } from './types.ts';

/** Every grammar point, N5 first, in teaching order within each level. */
export const GRAMMAR_CATALOGUE: readonly GrammarEntry[] = [
  ...N5_A,
  ...N5_B,
  ...N5_C,
  ...N4_A,
  ...N4_B,
  ...N4_C,
  ...N4_D,
  ...N3_A,
  ...N3_B,
  ...N3_C,
  ...N3_D,
  ...N3_E,
];
