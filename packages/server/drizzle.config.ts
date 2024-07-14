import type { Config } from "drizzle-kit";
import { resolve } from "node:path";
import { getRootDir } from "src/util/getRootDir";

export const DEFAULT_DB_NAME = resolve(getRootDir(), "./database.sqlite3");

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
	verbose: true,
  dialect: "sqlite",
  dbCredentials: {
    url: process.env['DB_FILE'] ?? DEFAULT_DB_NAME,
  },
} satisfies Config;