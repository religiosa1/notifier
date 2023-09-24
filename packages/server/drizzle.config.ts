import type { Config } from "drizzle-kit";

// FIXME actual conifg
import { databaseUrl } from "./config.current.json";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
	verbose: true,
	driver: "pg",
	dbCredentials: {
    connectionString: databaseUrl,
  }
} satisfies Config;