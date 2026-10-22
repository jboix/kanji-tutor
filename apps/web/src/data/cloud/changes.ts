import type { DBCore, Middleware } from 'dexie';
import { type KanjiTutorDb, USER_STORES } from '../db.ts';

/** The tables a save holds: the user's own, their sentences, and the settings. */
const SAVED = new Set<string>([...USER_STORES, 'sentences', 'settings']);

/**
 * Calls `onChange` after every write to a table the save holds, unless `muted()`: while a
 * save from another device is written in, which is no change of this device's. Writes of
 * dictionary sentences count too; the save's hash then shows that nothing changed.
 */
export function watchChanges(db: KanjiTutorDb, onChange: () => void, muted: () => boolean): void {
  const middleware: Middleware<DBCore> = {
    stack: 'dbcore',
    name: 'cloud-changes',
    create: (down) => ({
      ...down,
      table: (name) => {
        const table = down.table(name);
        if (!SAVED.has(name)) return table;
        return {
          ...table,
          mutate: async (request) => {
            const result = await table.mutate(request);
            if (!muted()) onChange();
            return result;
          },
        };
      },
    }),
  };
  db.use(middleware);
}
