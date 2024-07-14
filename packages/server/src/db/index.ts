import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import { SQLiteTransaction } from "drizzle-orm/sqlite-core";

import * as schema from "./schema";
export { schema };

export type DbTransactionClient = BetterSQLite3Database<typeof schema> | SQLiteTransaction<
	"sync",
	any,
	typeof schema,
	ExtractTablesWithRelations<typeof schema>
>;