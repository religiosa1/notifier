import bcrypt from "bcrypt";
import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
import { ResultError } from "@shared/models/Result";
import { parseApiKey } from "src/services/ApiKey";
import { inject } from "src/injection";
import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";

export const authorizeKey = createMiddleware(async (c, next) => {
	const apiKeysRepository = inject("ApiKeysRepository");
	const key = c.req.raw.headers.get("x-api-key") || getCookie(c, "X-API-KEY");		
	if (!key) {
		throw new ResultError(401, "The API key wasn't supplied in the cookies or headers");
	}
	const [prefix, keyHash] = parseApiKey(key);
	const storedKeyData = await apiKeysRepository.getKeyHashAndAuthStatus(prefix);
	if (storedKeyData?.authorizationStatus !== AuthorizationEnum.accepted) {
		throw new ResultError(403, "The user hasn't passed the verification procedure or was declined");
	}
	const match = await bcrypt.compare(keyHash, storedKeyData.hash);
	if (!match) {
		throw new ResultError(401, "Incorrect api key was supplied");
	}
	const user = await apiKeysRepository.getUserForKey(prefix);
	c.set("user", { name: user?.name, id: user?.id });
	await next();
});