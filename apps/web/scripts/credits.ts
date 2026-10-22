/** Writes `public/third-party-licenses.txt` (see `scripts/credits/third-party.ts`). */
import { writeFileSync } from 'node:fs';
import { OUTPUT, thirdPartyText } from './credits/third-party.ts';

writeFileSync(OUTPUT, `${thirdPartyText()}\n`);
console.log(`wrote ${OUTPUT}`);
