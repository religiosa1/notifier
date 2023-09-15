import { inject } from "src/injection";
import type { Handler } from '@fastify/middie';
import { ResultError } from "@shared/models/Result";
import { IncomingMessage, ServerResponse } from "http";

export const checkSettings: Handler = (req: IncomingMessage, _res: ServerResponse, next: (err?: unknown) => void) => {
	if (req.url === "/settings") {
		return next();
	}
	const serverSettings = inject("SettingsService");
	const config = serverSettings.getConfig();
	if (!config) {
		throw new ResultError(550, "Config Unavailable");
	}
	next();
};
