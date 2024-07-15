import Database from "better-sqlite3";

export function getDatabase(dbFile: string): Database.Database {
	if (!dbFile) {
		throw new Error("Database file name is not provided");
	}
	const db = new Database(dbFile);
	// Write-ahead-log is around 10 times faster than the standard rollback
	db.pragma("journal_mode = WAL;");
	// How synchronous is IO operation. NORMAL is a nice compromise between speed and safety
	db.pragma("synchronous = NORMAL;");
	// We shouldn't really have concurrent requests to db, but if we do, we're waiting 5s instead of immeadiately throwing
	db.pragma("busy_timeout = 5000;");
	// Cache size in N of pages. 2000 pages, 4096 KiB each (8MiB total)
	db.pragma("cache_size = 2000");
	// Temp store in memory
	db.pragma("temp_store = memory");
	db.pragma("foreign_keys = true");
	db.pragma("case_sensitive_like = OFF");
	return db;
}