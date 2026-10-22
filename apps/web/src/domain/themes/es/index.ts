/** Spanish unit texts (N9, D53), loaded on demand by `loadContentLanguage`. */
import type { ById, UnitText } from '../../content-types.ts';
import { ES_N3_A } from './n3-a.ts';
import { ES_N3_B } from './n3-b.ts';
import { ES_N3_C } from './n3-c.ts';
import { ES_N3_D } from './n3-d.ts';
import { ES_N3_E } from './n3-e.ts';
import { ES_N4_A } from './n4-a.ts';
import { ES_N4_B } from './n4-b.ts';
import { ES_N4_C } from './n4-c.ts';
import { ES_N4_D } from './n4-d.ts';
import { ES_N4_E } from './n4-e.ts';
import { ES_N5_A } from './n5-a.ts';
import { ES_N5_B } from './n5-b.ts';
import { ES_N5_C } from './n5-c.ts';
import { ES_N5_FIRST } from './n5-first.ts';

export const ES_UNITS: ById<UnitText> = {
  ...ES_N5_FIRST,
  ...ES_N5_A,
  ...ES_N5_B,
  ...ES_N5_C,
  ...ES_N4_A,
  ...ES_N4_B,
  ...ES_N4_C,
  ...ES_N4_D,
  ...ES_N4_E,
  ...ES_N3_A,
  ...ES_N3_B,
  ...ES_N3_C,
  ...ES_N3_D,
  ...ES_N3_E,
};
