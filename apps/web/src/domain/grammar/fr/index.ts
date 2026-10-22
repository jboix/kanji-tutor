/** French grammar and particle texts (N9, D53), loaded on demand by `loadContentLanguage`. */
import type { ById, FunctionWordText, GrammarText } from '../../content-types.ts';
import { FR_N3_A } from './n3-a.ts';
import { FR_N3_B } from './n3-b.ts';
import { FR_N3_C } from './n3-c.ts';
import { FR_N3_D } from './n3-d.ts';
import { FR_N3_E } from './n3-e.ts';
import { FR_N4_A } from './n4-a.ts';
import { FR_N4_B } from './n4-b.ts';
import { FR_N4_C } from './n4-c.ts';
import { FR_N4_D } from './n4-d.ts';
import { FR_N5_A } from './n5-a.ts';
import { FR_N5_B } from './n5-b.ts';
import { FR_N5_C } from './n5-c.ts';
import { FR_PARTICLES_A } from './particles-a.ts';
import { FR_PARTICLES_B } from './particles-b.ts';

export const FR_GRAMMAR: ById<GrammarText> = {
  ...FR_N5_A,
  ...FR_N5_B,
  ...FR_N5_C,
  ...FR_N4_A,
  ...FR_N4_B,
  ...FR_N4_C,
  ...FR_N4_D,
  ...FR_N3_A,
  ...FR_N3_B,
  ...FR_N3_C,
  ...FR_N3_D,
  ...FR_N3_E,
};

export const FR_PARTICLES: ById<FunctionWordText> = { ...FR_PARTICLES_A, ...FR_PARTICLES_B };
