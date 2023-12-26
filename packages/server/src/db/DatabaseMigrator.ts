import { di } from "src/injection";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "src/db/schema";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { hashPassword } from "src/services/hash";
import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
import { UserRoleEnum } from "@shared/models/UserRoleEnum";

export class DatabaseMigrator {
	constructor(
		private readonly settings = di.inject("SettingsService"),
		private readonly logger = di.inject("logger"),
	) { }

	private getDbConnection(): PostgresJsDatabase<typeof schema> & AsyncDisposable {
		const { databaseUrl } = this.settings.getConfig() ?? {};
		if (!databaseUrl) {
			throw new Error("No database url is present in the settings");
		}

		const sql = postgres(databaseUrl, { max: 1 });
		const db = drizzle(sql, { schema }) as PostgresJsDatabase<typeof schema> & AsyncDisposable;
		db[Symbol.asyncDispose] ??= () => sql.end();
		return db;
	}

	async migrate(): Promise<void> {
		await using db = this.getDbConnection();
		this.logger.info("Migrating the DB...");
		// FIX FOLDER
		await migrate(db, { migrationsFolder: "drizzle" });
		this.logger.info("Migration complete");
	}

	async seed(adminPassword: string): Promise<void> {
		await using db = this.getDbConnection();
		this.logger.info("Seedin the db, creating groups...");
		await db.insert(schema.groups)
			.values({ id: 1, name: "default" })
			.onConflictDoNothing();
		this.logger.info("Creating channels...");
		await db.insert(schema.channels)
			.values({ id: 1, name: "default"})
			.onConflictDoNothing();
		this.logger.info("Creating channelsToGroups relations...");
		await db.insert(schema.channelsToGroups)
			.values({ channelId: 1, groupId: 1})
			.onConflictDoNothing();
		this.logger.info("Creating users...");
		await db.insert(schema.users)
			.values({
				id: 1,
				telegramId: 1234567, // TODO move to setup
				name: 'admin',
				password: await hashPassword(adminPassword),
				authorizationStatus: AuthorizationEnum.accepted,
				role: UserRoleEnum.admin,
			})
			.onConflictDoNothing();
		this.logger.info("Creating usersToGroups relations...");
		await db.insert(schema.usersToGroups)
			.values({ userId: 1, groupId: 1 })
			.onConflictDoNothing();
		this.logger.info("Creating usersToChannels relations...");
		await db.insert(schema.usersToChannels)
			.values({ userId: 1, channelId: 1 })
			.onConflictDoNothing();
		this.logger.info("Seeding complete");
	}
}