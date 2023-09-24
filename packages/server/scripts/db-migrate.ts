#!/usr/bin/env tsx
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

// FIXME actual conifg
import { databaseUrl } from "config.current.json";

const sql = postgres(databaseUrl, { max: 1 })
const db = drizzle(sql);

async function main() {
	await migrate(db, { migrationsFolder: "drizzle" });
}
main()
	.then(() => { process.exit() })
	.catch(() => { process.exit(1) })
