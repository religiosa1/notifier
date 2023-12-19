import { Hono } from 'hono'
import z from "zod";
import { zValidator } from '@hono/zod-validator'

import { ResultError, result } from "@shared/models/Result";
import { serverConfigSchema } from "@shared/models/ServerConfig";
import { inject } from "src/injection";
import { ConfigUnavailableError } from "src/error/ConfigUnavailableError";
import { authorizeJWT } from 'src/middleware/authorizeJWT';

const controller = new Hono();

/**
 * 200: resultSuccessSchema(serverConfigSchema),
 * 403: resultFailureSchema,
 * 550: resultFailureSchema,
 */
controller.get(
	"/settings",
	authorizeJWT,
	async (c) => {
		const settingsService = inject("SettingsService");
		const config = settingsService.getConfig();
		if (!config) {
			return c.json(result(new ConfigUnavailableError()));
		}
		return c.json(result(config));
	}
);

controller.put(
	"/settings", 
	authorizeJWT, 
	zValidator("json", serverConfigSchema), 
	async (c) => {
		const settingsService = inject("SettingsService");
		const body = c.req.valid("json");

		await settingsService.setConfig(body);
		return c.json(result(null));
	}
);

// NO AUTH FOR THE INITIAL SETUP
controller.put("/setup", zValidator("json", serverConfigSchema), async (c) => {
	const settingsService = inject("SettingsService");
	const config = settingsService.getConfig();
	const body = c.req.valid("json");
	if (config) {
		return c.json(result(new ResultError(410, "Server has already been configured.")));
	}
	await settingsService.setConfig(body);

	// TODO: database connection, seeding, bot connection etc.

	return c.json(result(null));
});

controller.post("/test-database-configuration", zValidator("json", z.object({
	databaseUrl: z.string()
})), async (c) => {
	const settingsService = inject("SettingsService");
	const body = c.req.valid("json");
	const isDbOk = await settingsService.testConfigsDatabaseConnection(body.databaseUrl);
	return c.json(result(isDbOk));
});

export default controller;