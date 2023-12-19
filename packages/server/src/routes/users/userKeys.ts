import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { result } from "@shared/models/Result";
import { pageinationQuerySchema, paginationDefaults } from "@shared/models/Pagination";
import { counted } from "@shared/models/Counted";
import { apiKeyPrefixSchema } from "@shared/models/ApiKey";
import * as ApiKeyService from "src/services/ApiKey";
import { userIdParamsSchema } from './models';

const controller = new Hono(); 

controller.get(
	"/", 
	zValidator("param", userIdParamsSchema), 
	zValidator("query", pageinationQuerySchema),
	async(c) => {
		const { userId } = c.req.valid("param");
		const { skip, take } = { ...paginationDefaults, ...c.req.valid("query") };
		const [data, count] = await ApiKeyService.listKeys(userId, { skip, take });
		return c.json(result({ data, count }));
	}
);

controller.post(
	"/",
	zValidator("param", userIdParamsSchema),
	async (c) => {
		const { userId } = c.req.valid("param");
		const apiKey = await ApiKeyService.createKey(userId);
		return c.json(result({ apiKey }));
	}
);

controller.delete(
	"/:prefix",
	zValidator("param", userIdParamsSchema.extend({
		prefix: apiKeyPrefixSchema,
	})),
	async (c) => {
		const { prefix, userId } = c.req.valid("param");
		await ApiKeyService.deleteKey(userId, prefix);
		return c.json(null);
	}
);

controller.delete("/", zValidator("param", userIdParamsSchema), async (c) => {
	const { userId } = c.req.valid("param");
	const count = await ApiKeyService.deleteAllKeys(userId);
	return c.json(result(count));
});

export default controller;