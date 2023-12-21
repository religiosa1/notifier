import { di } from "src/injection";

import { ConfigUnavailableError } from "src/error/ConfigUnavailableError";
import { createMiddleware } from 'hono/factory';

export const checkSettings = createMiddleware((c, next) => {
	const serverSettings = di.inject("SettingsService");
	if (c.req.routePath.startsWith("/settings")) {
		const config = serverSettings.getConfig();
		if (!config) {
			throw new ConfigUnavailableError();
		}
	}
	return next();
});