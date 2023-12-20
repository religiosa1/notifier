import { ResultError, result } from "@shared/models/Result";
import { createMiddleware } from "hono/factory";

const MIME_JSON = "application/json";

export const responseHandler = createMiddleware(async (c, next) => {
	await next();
	const contentType =  c.res.headers.get("Content-Type");

	if (!c.error && contentType === MIME_JSON) {
		const oldResponse = await c.res.json();
		c.res = new Response(JSON.stringify(result(oldResponse)), {
			headers: {
				"Content-Type": MIME_JSON
			}
		})
	} else if (c.res.status === 404 && contentType !== MIME_JSON) {
		throw new ResultError(404);
	}
});

