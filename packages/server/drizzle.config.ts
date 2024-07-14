import type { Config } from "drizzle-kit";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_DB_NAME = path.resolve(fileURLToPath(import.meta.url), "../database.sqlite3");

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
	verbose: true,
  dialect: "sqlite",
  dbCredentials: {
    url: process.env['DB_FILE'] ?? DEFAULT_DB_NAME,
  },
} satisfies Config;