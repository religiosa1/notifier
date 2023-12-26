import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt"
import { di } from "src/injection";

import { getCookie } from "hono/cookie"
import { ResultError } from "@shared/models/Result";
import { tokenPayloadSchema } from "@shared/models/TokenPayload";
import { ConfigUnavailableError } from "src/error/ConfigUnavailableError";

export const authorizeJWT = createMiddleware(async (c, next) => {
	const settingsService = di.inject("SettingsService");	
	const {jwtSecret} = settingsService.getConfig() ?? {};
	if (!jwtSecret) {
		throw new ConfigUnavailableError()
	}

	// admin site uses header info, but for convenience we also handle cookies
	const authInfo = c.req.raw.headers.get("Authorization") || getCookie(c, "Authorization");
	if (!authInfo) {
		throw new ResultError(403, "No authorization token was supplied");
	}
	if (!authInfo.startsWith("Bearer ")) {
		throw new ResultError(400, "Malformed authorization information");
	}
	const token = authInfo?.substring("Bearer ".length);



	try {
		const decodedPayload = tokenPayloadSchema.parse(await verify(token, jwtSecret));

		c.set("jwtPayload", decodedPayload);
		c.set("user", { name: decodedPayload.name, id: decodedPayload.id });
	} catch(e) {
		throw new ResultError(401, "Unauthorized", { cause: e });
	}
	await next();
});