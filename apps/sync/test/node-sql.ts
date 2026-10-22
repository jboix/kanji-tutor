import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { Sql, SqlStatement } from '../src/sql.ts';

/** The server's `Sql` over Node's SQLite, so the tests run the SQL that Bun runs in production. */
export function nodeSql(): Sql {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  const statement = (sql: string, values: unknown[] = []): SqlStatement => {
    const args = values as SQLInputValue[];
    return {
      bind: (...next) => statement(sql, next),
      first: async <T>() => (db.prepare(sql).get(...args) as T | undefined) ?? null,
      all: async <T>() => ({ results: db.prepare(sql).all(...args) as T[] }),
      run: async () => ({ changes: Number(db.prepare(sql).run(...args).changes) }),
    };
  };
  return {
    prepare: (sql) => statement(sql),
    batch: async (statements) => {
      db.exec('BEGIN');
      try {
        for (const s of statements) await s.run();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
