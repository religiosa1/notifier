import { di } from "src/injection";
import * as schema from "src/db/schema";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { hashPassword } from "src/services/hash";
import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
import { UserRoleEnum } from "@shared/models/UserRoleEnum";

export class DatabaseMigrator {
	constructor(
		private readonly db = di.inject("db"),
		private readonly logger = di.inject("logger"),
	) { }

	async migrate(): Promise<void> {
		const connection = this.db.connection;
		this.logger.info("Migrating the DB...");
		// FIX FOLDER
		await migrate(connection, { migrationsFolder: "drizzle" });
		this.logger.info("Migration complete");
	}

	async seed(adminPassword: string, telegramId: number): Promise<void> {
		const db = this.db.connection;
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