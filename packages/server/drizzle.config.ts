import type { Config } from "drizzle-kit";

import { databaseUrl } from "./config.json";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
	verbose: true,
	driver: "pg",
	dbCredentials: {
    connectionString: databaseUrl,
  }
} satisfies Config;