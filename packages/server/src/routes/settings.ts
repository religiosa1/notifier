import { Hono } from 'hono'
import z from "zod";
import { zValidator } from '@hono/zod-validator'

import { ResultError } from "@shared/models/Result";
import { serverConfigSchema, type ServerConfig } from "@shared/models/ServerConfig";
import { di } from "src/injection";

import { ConfigUnavailableError } from "src/error/ConfigUnavailableError";
import { authorizeJWT } from 'src/middleware/authorizeJWT';

const controller = new Hono();

controller.get(
	"/",
	authorizeJWT,
	async (c) => {
		const settingsService = di.inject("SettingsService");
		const config = settingsService.getConfig();
		if (!config) {
			throw new ConfigUnavailableError();
		}
		return c.json(config satisfies ServerConfig);
	}
);

controller.put(
	"/", 
	authorizeJWT, 
	zValidator("json", serverConfigSchema), 
	async (c) => {
		const settingsService = di.inject("SettingsService");
		const body = c.req.valid("json");

		await settingsService.setConfig(body);
		return c.json(null);
	}
);

// TODO do we even need this route?..
// NO AUTH FOR THE INITIAL SETUP
controller.put("/setup", zValidator("json", serverConfigSchema), async (c) => {
	const settingsService = di.inject("SettingsService");
	const config = settingsService.getConfig();
	const body = c.req.valid("json");
	if (config) {
		throw new ResultError(410, "Server has already been configured.");
	}
	await settingsService.setConfig(body);

	// TODO: database connection, seeding, bot connection etc.

	return c.json(null);
});

controller.post("/test-database-configuration", zValidator("json", z.object({
	databaseUrl: z.string()
})), async (c) => {
	const settingsService = di.inject("SettingsService");
	const body = c.req.valid("json");
	const isDbOk: boolean = await settingsService.testConfigsDatabaseConnection(body.databaseUrl);
	return c.json(isDbOk);
});

export default controller;