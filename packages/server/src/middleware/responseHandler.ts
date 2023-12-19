import { result } from "@shared/models/Result";
import { createMiddleware } from "hono/factory";

export const responseHandler = createMiddleware(async (c, next) => {
	try {
		await next();
		const oldResponse = await c.res.json();
		c.res = new Response(JSON.stringify(result(oldResponse)));
	} catch(e) {
		console.log("EGGOG", e);
		// что-то делать с ошибкой тут
	}
});