import type { Table } from 'dexie';
import type { Store } from '../domain/repos.ts';

/** Adapts a Dexie table to the generic `Store` port. */
export function tableStore<T, K extends string>(table: Table<T, K>): Store<T, K> {
  return {
    get: (key) => table.get(key),
    getMany: (keys) => table.bulkGet([...keys]),
    put: async (value) => {
      await table.put(value);
    },
    putMany: async (values) => {
      await table.bulkPut([...values]);
    },
    delete: (key) => table.delete(key),
    all: () => table.toArray(),
    count: () => table.count(),
  };
}
