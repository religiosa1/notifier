import { ResultError, result } from "@shared/models/Result";
import { createMiddleware } from "hono/factory";


const MIME_JSON = "application/json";
const COMMON_RESPONSE_INIT: ResponseInit = {
	headers: { "Content-Type": `${MIME_JSON}; charset=UTF-8` }
};

export const responseHandler = createMiddleware(async (c, next) => {
	await next();
	const [mimeType] = c.res.headers.get("Content-Type")?.split(';', 1) ?? [];
	if (!c.error && mimeType === MIME_JSON) {
		const oldResponse = await c.res.json();
		if (oldResponse && typeof oldResponse === "object" && "success" in oldResponse && !oldResponse.success) {
			c.res = new Response(JSON.stringify({ ...oldResponse, ts: Date.now() }), {
				...COMMON_RESPONSE_INIT,
				status: 400
			});
		} else {
			// TODO successfull Result handling, to avoid wrapped results
			c.res = new Response(JSON.stringify(result(oldResponse)), COMMON_RESPONSE_INIT);
		}
	
	} else if (c.res.status === 404 && mimeType !== MIME_JSON) {
		throw new ResultError(404);
	}
});

