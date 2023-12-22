import { ResultError, result } from "@shared/models/Result";
import { createMiddleware } from "hono/factory";

const MIME_JSON = "application/json";
const CONTENT_TYPE = 'application/json; charset=UTF-8';

export const responseHandler = createMiddleware(async (c, next) => {
	await next();
	const [mimeType] = c.res.headers.get("Content-Type")?.split(';', 1) ?? [];
	if (!c.error && mimeType === MIME_JSON) {
		const oldResponse = await c.res.json();
		c.res = new Response(JSON.stringify(result(oldResponse)), {
			headers: {
				"Content-Type": CONTENT_TYPE
			}
		})
	} else if (c.res.status === 404 && mimeType !== MIME_JSON) {
		throw new ResultError(404);
	}
});

