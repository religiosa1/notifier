import { randomBytes } from "crypto";
import { base32, base64 } from "rfc4648";
import { apiKeySchema } from "@shared/models/ApiKey";
import { hash } from "src/Authorization/hash";
import { inject } from "src/injection";
import { schema } from "src/db";
import { and, eq, sql } from "drizzle-orm";

const dbm = inject("db");

function generateApiKey(): string {
	const key = base64.stringify(randomBytes(30))
	const prefix = base32.stringify(randomBytes(5));
	return prefix + '.' + key;
}

export function parseApiKey(apiKey: string): [prefix: string, key: string] {
	const validated = apiKeySchema.parse(apiKey);
	const [prefix, key] = validated.split('.', 2);
	// fields validated by the regex
	return [prefix!, key!];
}

/** Create key for a user, and save it in th db for the user */
export async function createKey(userId: number): Promise<string> {
	const apiKey = generateApiKey();
	const [prefix, key] = parseApiKey(apiKey);
	const hashedKey = await hash(key);
	const db = dbm.connection;
	db.insert(schema.apiKeys).values({
		userId,
		prefix,
		hash: hashedKey,
	});
	return apiKey;
}

const countKeysQuery = dbm.prepare((db) => db.select({
	count: sql<number>`count(*)`,
}).from(schema.apiKeys)
	.where(eq(schema.apiKeys.userId, sql.placeholder("userId")))
	.prepare("count_keys_query")
);
const getKeysQuery = dbm.prepare((db) => db.select({
		prefix: schema.apiKeys.prefix,
		createdAt: schema.apiKeys.createdAt,
	}).from(schema.apiKeys)
		.where(eq(schema.apiKeys.userId, sql.placeholder("userId")))
		.limit(sql.placeholder("take"))
		.offset(sql.placeholder("skip"))
		.prepare("get_keys_query")
);
export async function getKeys(
	userId: number,
	{
		skip = 0,
		take = 20
	} = {}
): Promise<[
	data: Array<{
		prefix: string;
		createdAt: Date;
	}>,
	total: number,
]> {
	const [ keys, [{ count = -1} = {}]] = await Promise.all([
		getKeysQuery.value.execute({ userId, skip, take }),
		countKeysQuery.value.execute({ userId }),
	]);
	return [keys, count ];
}

const deleteKeysQuery = dbm.prepare(db => db.delete(schema.apiKeys)
	.where(and(
		eq(schema.apiKeys.userId, sql.placeholder("userId")),
		eq(schema.apiKeys.prefix, sql.placeholder("prefix")),
	))
	.prepare("delete_keys_query")
);
export async function deleteKey(
	userId: number,
	prefix: string
): Promise<void> {
	await deleteKeysQuery.value.execute({ userId, prefix });
}

const deleteAllKeysQuery = dbm.prepare(db => db.delete(schema.apiKeys)
	.where(eq(schema.apiKeys.userId, sql.placeholder("userId")))
	.returning({ count: sql<number>`count(*)`})
	.prepare("delete_all_keys")
);
export async function deleteAllKeys(userId: number): Promise<number> {
	const [{ count = -1 } = {}] =await deleteAllKeysQuery.value.execute({ userId });
	return count;
}