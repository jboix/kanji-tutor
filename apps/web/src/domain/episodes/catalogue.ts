/** Every episode, in path order: N5, N4, N3. */
import { N3_EPISODES } from './n3.ts';
import { N4_EPISODES } from './n4.ts';
import { N5_EPISODES } from './n5.ts';
import type { Episode } from './types.ts';

export const EPISODES: readonly Episode[] = [...N5_EPISODES, ...N4_EPISODES, ...N3_EPISODES];
