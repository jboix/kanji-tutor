/** French unit texts (N9), loaded on demand by `loadContentLanguage`. */
import type { ById, UnitText } from '../../content-types.ts';
import { FR_N3_A } from './n3-a.ts';
import { FR_N3_B } from './n3-b.ts';
import { FR_N3_C } from './n3-c.ts';
import { FR_N3_D } from './n3-d.ts';
import { FR_N3_E } from './n3-e.ts';
import { FR_N4_A } from './n4-a.ts';
import { FR_N4_B } from './n4-b.ts';
import { FR_N4_C } from './n4-c.ts';
import { FR_N4_D } from './n4-d.ts';
import { FR_N4_E } from './n4-e.ts';
import { FR_N5_A } from './n5-a.ts';
import { FR_N5_B } from './n5-b.ts';
import { FR_N5_C } from './n5-c.ts';
import { FR_N5_FIRST } from './n5-first.ts';

export const FR_UNITS: ById<UnitText> = {
  ...FR_N5_FIRST,
  ...FR_N5_A,
  ...FR_N5_B,
  ...FR_N5_C,
  ...FR_N4_A,
  ...FR_N4_B,
  ...FR_N4_C,
  ...FR_N4_D,
  ...FR_N4_E,
  ...FR_N3_A,
  ...FR_N3_B,
  ...FR_N3_C,
  ...FR_N3_D,
  ...FR_N3_E,
};
