import { di } from "src/injection";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "src/db/schema";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { hashPassword } from "src/services/hash";
import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
import { UserRoleEnum } from "@shared/models/UserRoleEnum";
import { getDatabase } from "src/db/db";

export class DatabaseMigrator {
	constructor(
		private readonly logger = di.inject("logger"),
	) { }

	private getDbConnection(): BetterSQLite3Database<typeof schema> & Disposable {
		const database = getDatabase();
		const db = drizzle(database, { schema }) as BetterSQLite3Database<typeof schema> & Disposable;
		db[Symbol.dispose] ??= () => database.close();
		return db;
	}

	async migrate(): Promise<void> {
		using db = this.getDbConnection();
		this.logger.info("Migrating the DB...");
		// FIX FOLDER
		await migrate(db as any, { migrationsFolder: "drizzle" });
		this.logger.info("Migration complete");
	}

	async seed(adminPassword: string, telegramId: number): Promise<void> {
		using db = this.getDbConnection();
		this.logger.info("Seedin the db, creating groups...");
		await db.transaction(async () => {
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
					telegramId,
					name: "admin",
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
		}, { behavior: "immediate" });
		this.logger.info("Seeding complete");
	}
}