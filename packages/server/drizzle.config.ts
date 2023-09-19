import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
	verbose: true,
	driver: "pg",
	dbCredentials: {
    connectionString: "postgres://postgres:1234567@127.0.0.1:5432/notifier",
  }
} satisfies Config;