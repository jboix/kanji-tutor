/**
 * The few SQL calls the server makes, as one small interface: Bun's SQLite runs it in
 * production (`bun-sql.ts`), Node's in the tests, so the same SQL is tested as deployed.
 */

export interface SqlStatement {
  bind(...values: unknown[]): SqlStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  /** Runs it; `changes` is how many rows it changed. */
  run(): Promise<{ changes: number }>;
}

export interface Sql {
  prepare(sql: string): SqlStatement;
  /** Runs the statements in one transaction: all or none. */
  batch(statements: SqlStatement[]): Promise<void>;
}
