import { inject } from "src/injection";
import type { Handler } from '@fastify/middie';
import { IncomingMessage, ServerResponse } from "http";
import { ConfigUnavailableError } from "src/error/ConfigUnavailableError";

export const checkSettings: Handler = (req: IncomingMessage, _res: ServerResponse, next: (err?: unknown) => void) => {
	if (req.url === "/settings") {
		return next();
	}
	const serverSettings = inject("SettingsService");
	const config = serverSettings.getConfig();
	if (!config) {
		throw new ConfigUnavailableError();
	}
	next();
};
