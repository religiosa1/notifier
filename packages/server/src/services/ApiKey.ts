import { randomBytes } from "crypto";
import { base32, base64 } from "rfc4648";
import { apiKeySchema } from "@shared/models/ApiKey";
import { hash } from "src/Authorization/hash";
import { inject } from "src/injection";

const apiKeysRepository = inject("ApiKeysRepository");

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
	const { keys, count } = await apiKeysRepository.listKeys(userId, { skip, take });
	return [keys, count ];
}

export async function deleteKey(
	userId: number,
	prefix: string
): Promise<void> {
	await apiKeysRepository.deleteKey(userId, prefix);
}

export async function deleteAllKeys(userId: number): Promise<number> {
	return apiKeysRepository.deleteAllKeysForUser(userId);
}