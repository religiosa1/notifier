import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";

import * as schema from "./schema";
import Database from "better-sqlite3";
export { schema };

export type Transaction = SQLiteTransaction<"sync", Database.RunResult, typeof schema, ExtractTablesWithRelations<typeof schema>>;

export type DbTransactionClient = BetterSQLite3Database<typeof schema> | Transaction;

export function isUniqueConstraintError(e: unknown): boolean {
	// https://sqlite.org/rescode.html
	return e instanceof Database.SqliteError && e.code === "SQLITE_CONSTRAINT_UNIQUE"
}