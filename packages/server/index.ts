import "dotenv/config";
import "./src/polyfill";

import { serve } from '@hono/node-server'

import { di } from "src/injection";
import { app } from "src/app";

const port = Number(process.env.PORT) || 8085;

serve({ fetch: app.fetch , port }, (info) => {
	const appListenService = di.inject("AppListenService");
	appListenService.listen(info);
	// warming up the bot immediately, so it can initialize everything before requests
	di.inject("Bot");
});
