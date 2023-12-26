import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { paramErrorHook, validationErrorHook } from 'src/middleware/validationErrorHandlers';

import { pageinationQuerySchema, paginationDefaults } from "@shared/models/Pagination";
import type { Counted } from "@shared/models/Counted";
import type { ApiKeyPreview } from "@shared/models/ApiKey";
import { apiKeyPrefixSchema } from "@shared/models/ApiKey";
import * as ApiKeyService from "src/services/ApiKey";
import { userIdParamsSchema } from './models';

const controller = new Hono(); 

controller.get(
	"/", 
	zValidator("param", userIdParamsSchema, paramErrorHook), 
	zValidator("query", pageinationQuerySchema, validationErrorHook),
	async(c) => {
		const { userId } = c.req.valid("param");
		const { skip, take } = { ...paginationDefaults, ...c.req.valid("query") };
		const [data, count] = await ApiKeyService.listKeys(userId, { skip, take });
		return c.json({ data, count } satisfies Counted<ApiKeyPreview[]>);
	}
);

controller.post(
	"/",
	zValidator("param", userIdParamsSchema, paramErrorHook),
	async (c) => {
		const { userId } = c.req.valid("param");
		const apiKey: string = await ApiKeyService.createKey(userId);
		return c.json({ apiKey });
	}
);

controller.delete(
	"/:prefix",
	zValidator("param", userIdParamsSchema.extend({
		prefix: apiKeyPrefixSchema,
	}), paramErrorHook),
	async (c) => {
		const { prefix, userId } = c.req.valid("param");
		await ApiKeyService.deleteKey(userId, prefix);
		return c.json(null);
	}
);

controller.delete(
	"/", 
	zValidator("param", userIdParamsSchema, paramErrorHook), 
	async (c) => {
		const { userId } = c.req.valid("param");
		const count: number = await ApiKeyService.deleteAllKeys(userId);
		return c.json(count);
	}
);

export default controller;