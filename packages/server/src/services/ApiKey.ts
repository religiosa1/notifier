import { randomBytes } from "crypto";
import { base32, base64 } from "rfc4648";
import { apiKeySchema } from "@shared/models/ApiKey";
import { hashPassword } from "src/services/hash";
import { di } from "src/injection";


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
	const apiKeysRepository = di.inject("ApiKeysRepository");
	const apiKey = generateApiKey();
	const [prefix, key] = parseApiKey(apiKey);
	const hashedKey = await hashPassword(key);
	await apiKeysRepository.insertKey(userId, prefix, hashedKey);
	return apiKey;
}

export async function listKeys(
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
	const apiKeysRepository = di.inject("ApiKeysRepository");
	return apiKeysRepository.listKeys(userId, { skip, take });
}

export async function deleteKey(
	userId: number,
	prefix: string
): Promise<void> {
	const apiKeysRepository = di.inject("ApiKeysRepository");
	await apiKeysRepository.deleteKey(userId, prefix);
}

export async function deleteAllKeys(userId: number): Promise<number> {
	const apiKeysRepository = di.inject("ApiKeysRepository");
	return apiKeysRepository.deleteAllKeysForUser(userId);
}