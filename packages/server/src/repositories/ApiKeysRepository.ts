import { ResultError } from "@shared/models/Result";
import { and, eq, sql } from "drizzle-orm";
import { schema } from "src/db";
import { inject } from "src/injection";

export class ApiKeysRepository {
	private readonly dbm = inject("db");

	async insertKey(userId: number, prefix: string, hashedKey: string): Promise<void> {
		const db = this.dbm.connection;
		db.insert(schema.apiKeys).values({
			userId,
			prefix,
			hash: hashedKey,
		});
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
		.returning({ count: sql<number>`count(*)::int`})
		.prepare("delete_key")
	);
	async deleteKey(userId: number, prefix: string): Promise<void> {
		const [ { count = 0 } = {}] = await this.queryDeleteKey.value.execute({ userId, prefix });
		if (!count) {
			throw new ResultError(404, `Can't find a key for user id = "${userId}" and prefix = "${prefix}"`);
		}
	}

	private queryDeleteAllKeys = this.dbm.prepare(db => db.delete(schema.apiKeys)
		.where(eq(schema.apiKeys.userId, sql.placeholder("userId")))
		.returning({ count: sql<number>`count(*)::int`})
		.prepare("delete_key")
	);
	async deleteAllKeysForUser(userId: number): Promise<number> {
		const [ { count = -1 } = {}] = await this.queryDeleteAllKeys.value.execute({ userId });
		return count;
	}
}