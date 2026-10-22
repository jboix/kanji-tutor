import { Database, type SQLQueryBindings } from 'bun:sqlite';
import type { Sql, SqlStatement } from './sql.ts';

/** The server's SQLite file, in WAL mode, with foreign keys on. */
export function openSqlite(path: string): Database {
  const db = new Database(path, { create: true, strict: true });
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000');
  return db;
}

/** The `Sql` interface over Bun's SQLite (synchronous, wrapped in promises). */
export function bunSql(db: Database): Sql {
  const statement = (sql: string, values: unknown[] = []): SqlStatement => {
    const args = values as SQLQueryBindings[];
    return {
      bind: (...next) => statement(sql, next),
      first: async <T>() => (db.query(sql).get(...args) as T | null) ?? null,
      all: async <T>() => ({ results: db.query(sql).all(...args) as T[] }),
      run: async () => ({ changes: db.query(sql).run(...args).changes }),
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
