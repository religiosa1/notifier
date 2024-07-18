import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
import { ResultError } from "@shared/models/Result";
import { and, count, eq, sql } from "drizzle-orm";
import { schema } from "src/db";
import { NotFoundError } from "src/error/NotFoundError";
import { di } from "src/injection";

export class ApiKeysRepository {
	private readonly dbm = di.inject("db");

	private readonly queryInsertKey = this.dbm.prepare((db) =>
		db
			.insert(schema.apiKeys)
			.values({
				userId: sql.placeholder("userId"),
				prefix: sql.placeholder("prefix"),
				hash: sql.placeholder("hash"),
			})
			.prepare()
	);
	async insertKey(userId: number, prefix: string, hashedKey: string): Promise<void> {
		await this.assertUserExists(userId);
		await this.queryInsertKey.value.execute({
			userId,
			prefix,
			hash: hashedKey,
		});
	}

	//============================================================================
	// GET

	private readonly queryGetKeyHashAndAuthStatus = this.dbm.prepare((db) =>
		db
			.select({
				hash: schema.apiKeys.hash,
				authorizationStatus: schema.users.authorizationStatus,
			})
			.from(schema.apiKeys)
			.innerJoin(schema.users, eq(schema.users.id, schema.apiKeys.userId))
			.where(eq(schema.apiKeys.prefix, sql.placeholder("prefix")))
			.limit(1)
			.prepare()
	);
	async getKeyHashAndAuthStatus(prefix: string): Promise<
		| {
				hash: string;
				authorizationStatus: AuthorizationEnum;
		  }
		| undefined
	> {
		const [data] = await this.queryGetKeyHashAndAuthStatus.value.execute({ prefix });
		return data;
	}

	private readonly queryGetUserForKey = this.dbm.prepare((db) =>
		db
			.select({
				id: schema.users.id,
				name: schema.users.name,
			})
			.from(schema.users)
			.innerJoin(schema.apiKeys, eq(schema.apiKeys.userId, schema.users.id))
			.where(eq(schema.apiKeys.prefix, sql.placeholder("prefix")))
			.limit(1)
			.prepare()
	);
	async getUserForKey(prefix: string): Promise<
		| {
				name: string | null;
				id: number;
		  }
		| undefined
	> {
		const [data] = await this.queryGetUserForKey.value.execute({ prefix });
		return data;
	}

	//============================================================================
	// LIST

	private readonly queryCountKeys = this.dbm.prepare((db) =>
		db
			.select({
				count: count(),
			})
			.from(schema.apiKeys)
			.where(eq(schema.apiKeys.userId, sql.placeholder("userId")))
			.prepare()
	);
	private readonly queryGetKeys = this.dbm.prepare((db) =>
		db
			.select({
				prefix: schema.apiKeys.prefix,
				createdAt: schema.apiKeys.createdAt,
			})
			.from(schema.apiKeys)
			.where(eq(schema.apiKeys.userId, sql.placeholder("userId")))
			.limit(sql.placeholder("take"))
			.offset(sql.placeholder("skip"))
			.prepare()
	);

	async listKeys(
		userId: number,
		{ skip = 0, take = 20 } = {}
	): Promise<
		[
			keys: Array<{
				prefix: string;
				createdAt: Date;
			}>,
			totalCount: number,
		]
	> {
		await this.assertUserExists(userId);
		const [keys, [{ count = -1 } = {}]] = await Promise.all([
			this.queryGetKeys.value.execute({ userId, skip, take }),
			this.queryCountKeys.value.execute({ userId }),
		]);
		return [keys, count];
	}

	//============================================================================
	// DELETE

	private readonly queryDeleteKey = this.dbm.prepare((db) =>
		db
			.delete(schema.apiKeys)
			.where(and(eq(schema.apiKeys.userId, sql.placeholder("userId")), eq(schema.apiKeys.prefix, sql.placeholder("prefix"))))
			.returning()
			.prepare()
	);
	async deleteKey(userId: number, prefix: string): Promise<void> {
		await this.assertUserExists(userId);
		const data = await this.queryDeleteKey.value.execute({ userId, prefix });
		if (!data?.length) {
			throw new ResultError(404, `Can't find a key for user id = "${userId}" and prefix = "${prefix}"`);
		}
	}

	private readonly queryDeleteAllKeys = this.dbm.prepare((db) =>
		db
			.delete(schema.apiKeys)
			.where(eq(schema.apiKeys.userId, sql.placeholder("userId")))
			.prepare()
	);
	async deleteAllKeysForUser(userId: number): Promise<number> {
		await this.assertUserExists(userId);
		const { changes } = await this.queryDeleteAllKeys.value.execute({ userId });
		return changes;
	}

	private readonly checkUserId = this.dbm.prepare((db) =>
		db
			.select({ id: schema.users.id })
			.from(schema.users)
			.where(eq(schema.users.id, sql.placeholder("userId")))
			.prepare()
	);
	private async assertUserExists(userId: number): Promise<void> {
		const resp = await this.checkUserId.value.execute({ userId });
		if (!resp.length) {
			throw new NotFoundError(`User with ID=${userId} cannot be found`);
		}
	}
}
