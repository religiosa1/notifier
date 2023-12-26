import { createMiddleware } from "hono/factory";

import { authorizeJWT } from "./authorizeJWT";
import { authorizeKey } from "./authorizeKey";
import { getCookie } from "hono/cookie";

export const authorizeAnyMethod = createMiddleware(async (c, next) => {
	if (getCookie(c, 'Authorization')) {
		return authorizeJWT(c, next);
	}
	return authorizeKey(c, next);
});