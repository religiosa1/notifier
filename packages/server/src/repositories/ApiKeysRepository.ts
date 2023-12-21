import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
import { ResultError } from "@shared/models/Result";
import { and, eq, sql } from "drizzle-orm";
import { schema } from "src/db";
import { di } from "src/injection";


export class ApiKeysRepository {
	private readonly dbm = di.inject("db");

	async insertKey(userId: number, prefix: string, hashedKey: string): Promise<void> {
		const db = this.dbm.connection;
		db.insert(schema.apiKeys).values({
			userId,
			prefix,
			hash: hashedKey,
		});
	}

	//============================================================================
	// GET

	private readonly queryGetKeyHashAndAuthStatus = this.dbm.prepare(
		(db) => db.select({
			hash: schema.apiKeys.hash,
			authorizationStatus: schema.users.authorizationStatus
		}).from(schema.apiKeys)
			.innerJoin(schema.users, eq(schema.users.id, schema.apiKeys.userId))
			.where(eq(schema.apiKeys.prefix, sql.placeholder("prefix")))
			.limit(1)
			.prepare("get_key_hash_and_auth_status")
	);
	async getKeyHashAndAuthStatus(prefix: string): Promise<{
		hash: string,
		authorizationStatus: AuthorizationEnum
	} | undefined> {
		const [data] = await this.queryGetKeyHashAndAuthStatus.value.execute({ prefix });
		return data;
	}

	private readonly queryGetUserForKey = this.dbm.prepare(
		(db) => db.select({ 
			id: schema.users.id,
			name: schema.users.name,
		}).from(schema.users)
			.innerJoin(schema.apiKeys, eq(schema.apiKeys.userId, schema.users.id))
			.where(eq(schema.apiKeys.prefix, sql.placeholder("prefix")))
			.limit(1)
			.prepare("query_get_user_for_key")
	);
	async getUserForKey(prefix: string): Promise<{
		name: string | null;
		id: number;
	} | undefined> {
		const [data] = await this.queryGetUserForKey.value.execute({ prefix });
		return data;
	}

	//============================================================================
	// LIST

	private readonly queryCountKeys = this.dbm.prepare((db) => db.select({
		count: sql<number>`count(*)::int`,
	}).from(schema.apiKeys)
		.where(eq(schema.apiKeys.userId, sql.placeholder("userId")))
		.prepare("count_keys")
	);
	private readonly queryGetKeys = this.dbm.prepare((db) => db.select({
			prefix: schema.apiKeys.prefix,
			createdAt: schema.apiKeys.createdAt,
		}).from(schema.apiKeys)
			.where(eq(schema.apiKeys.userId, sql.placeholder("userId")))
			.limit(sql.placeholder("take"))
			.offset(sql.placeholder("skip"))
			.prepare("list_keys")
	);

	async listKeys(userId: number, { skip = 0, take = 20} = {}): Promise<[
		keys: Array<{
			prefix: string;
			createdAt: Date;
		}>,
		totalCount: number,
	]> {
		const [keys, [{ count = -1} = {}]] = await Promise.all([
			this.queryGetKeys.value.execute({ userId, skip, take }),
			this.queryCountKeys.value.execute({ userId }),
		]);
		return [ keys, count ];
	}

	//============================================================================
	// DELETE

	private readonly queryDeleteKey = this.dbm.prepare(db => db.delete(schema.apiKeys)
		.where(and(
			eq(schema.apiKeys.userId, sql.placeholder("userId")),
			eq(schema.apiKeys.prefix, sql.placeholder("prefix")),
		))
		.returning()
		.prepare("delete_key")
	);
	async deleteKey(userId: number, prefix: string): Promise<void> {
		const data = await this.queryDeleteKey.value.execute({ userId, prefix });
		if (!data?.length) {
			throw new ResultError(404, `Can't find a key for user id = "${userId}" and prefix = "${prefix}"`);
		}
	}

	private queryDeleteAllKeys = this.dbm.prepare(db => db.delete(schema.apiKeys)
		.where(eq(schema.apiKeys.userId, sql.placeholder("userId")))
		.prepare("delete_key")
	);
	async deleteAllKeysForUser(userId: number): Promise<number> {
		const {count} = await this.queryDeleteAllKeys.value.execute({ userId });
		return count;
	}
}