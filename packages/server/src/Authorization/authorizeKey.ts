import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
import { ResultError } from "@shared/models/Result";
import { parseApiKey } from "src/services/ApiKey";
import { inject } from "src/injection";
import { eq, sql } from "drizzle-orm";
import { schema } from "src/db";
import { assert } from "src/util/assert";

const dbm = inject("db");

const getKeyHashAndRelatedUserAuthStatusQuery = dbm.prepare((db) => db.select({
	hash: schema.apiKeys.hash,
	userAuthorizationStatus: schema.users.authorizationStatus
}).from(schema.users)
	.innerJoin(schema.apiKeys, eq(schema.apiKeys.userId, schema.users.id))
	.where(eq(schema.apiKeys.prefix, sql.placeholder("prefix")))
	.prepare("get_key_hash_and_related_user_auth_status_query")
);

export async function authorizeKey(
	fastify: FastifyInstance,
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> {
	try {
		const key = (
			Array.isArray(request.headers["x-api-key"])
				? request.headers["x-api-key"].at(-1)
				: request.headers["x-api-key"]
		) || (
			fastify.parseCookie(request.headers.cookie || "")["X-API-KEY"]
		) || "";
		if (!key) {
			throw new ResultError(401, "The API key wasn't supplied in the cookies or headers");
		}
		const [prefix, keyHash] = parseApiKey(key);
		const [storedKeyData] = await getKeyHashAndRelatedUserAuthStatusQuery.value.execute({ prefix });
		assert(storedKeyData);
		if (storedKeyData.userAuthorizationStatus !== AuthorizationEnum.accepted) {
			throw new ResultError(403, "The user hasn't passed the verification procedure or was declined");
		}
		const match = await bcrypt.compare(keyHash, storedKeyData.hash);
		if (!match) {
			throw new ResultError(401, "Incorrect api key was supplied");
		}
	} catch (err) {
		const apiErr = ResultError.from(err);
		reply.code(apiErr.statusCode).send(err)
	}
}