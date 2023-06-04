import { randomBytes } from "crypto";
import { base32, base64 } from "rfc4648";
import { apiKeySchema } from "@shared/models/ApiKey";
import type { DbTransactionClient } from "src/db";
import { hash } from "src/Authorization/hash";

function generateApiKey(): string {
  const key = base64.stringify(randomBytes(30))
  const prefix = base32.stringify(randomBytes(5));
  return prefix + '.' + key;
}

export function parseApiKey(apiKey: string): [prefix: string, key: string] {
  const validated = apiKeySchema.parse(apiKey);
  const [ prefix, key ] = validated.split('.', 2);
  // fields validated by the regex
  return [ prefix!, key! ];
}

/** Create key for a user, and save it in th db for the user */
export async function createKey(tx: DbTransactionClient, userId: number): Promise<string> {
	const apiKey = generateApiKey();
	const [ prefix, key ] = parseApiKey(apiKey);
	const hashedKey = await hash(key);
	await tx.apiKey.create({
		data: {
			prefix: prefix,
			hash: hashedKey,
			userId
		}
	});
	return apiKey;
}

export async function getKeys(
	tx: DbTransactionClient,
	userId: number,
	{
		skip,
		take
	} = {
		skip: 0,
		take: 20,
	}): Promise<[
		data: Array<{
			prefix: string;
    	createdAt: Date;
		}>,
		total: number,
	]>{
	return Promise.all([
		tx.apiKey.findMany({
			skip,
			take,
			select: { prefix: true, createdAt: true },
			where: { userId }
		}),
		tx.apiKey.count({ where: { userId } }),
	] as const);
}

export async function deleteKey(
	tx: DbTransactionClient,
	userId: number,
	keyPrefix: string
): Promise<void> {
		// Specifically doing it through the user, so we control, that userId is correct
		await tx.user.update({
			where: { id: userId },
			data: { ApiKeys: { delete: { prefix: keyPrefix } } }
		});
}