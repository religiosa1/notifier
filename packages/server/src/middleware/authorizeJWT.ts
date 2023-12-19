import { createMiddleware } from "hono/factory";
import { verify } from 'hono/jwt'
import { inject } from "src/injection";
import { getCookie } from 'hono/cookie'
import { ResultError } from "@shared/models/Result";
import { tokenPayloadSchema } from "@shared/models/TokenPayload";
import { ConfigUnavailableError } from "src/error/ConfigUnavailableError";

export const authorizeJWT = createMiddleware(async (c, next) => {
	const settingsService = inject("SettingsService");	
	const {jwtSecret} = settingsService.getConfig() ?? {};
	if (!jwtSecret) {
		throw new ConfigUnavailableError()
	}
	const tokenCookie = getCookie(c, 'Authorization');
	if (!tokenCookie) {
		throw new ResultError(403, "No authorization token was supplied");
	}
	const token = tokenCookie?.substring("Bearer ".length);
	try {
		const decodedPayload = tokenPayloadSchema.parse(await verify(token, jwtSecret));
		c.set("jwtPayload", decodedPayload);
		c.set("user", { name: decodedPayload.name, id: decodedPayload.id });
	} catch(e) {
		throw new ResultError(401, "Unauthorized", { cause: e });
	}
	await next();
});