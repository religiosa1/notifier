import "dotenv/config";
import "./src/polyfill";

import { Hono } from "hono";
import { serve } from '@hono/node-server'

import { di } from "src/injection";

import { ResultError } from "@shared/models/Result";
import { checkSettings } from "src/middleware/checkSettings";
import { responseHandler } from "src/middleware/responseHandler";
import { logger } from "src/middleware/logger";

import settings from "src/routes/settings";
import usersController from "src/routes/users";
import groupsController from "src/routes/groups";
import channelsController from "src/routes/channels";
import notifyController from "src/routes/notify";
import authRequestController from "src/routes/user-confirmation-request";
import loginController from "src/routes/login";
import botController from "src/routes/bot";

const port = Number(process.env.PORT) || 8085;
const settingsService = di.inject("SettingsService");

const app = new Hono();
app.onError((err) => {
	di.inject("logger").error(err);
	const resultError = ResultError.from(err);
	return  new Response(resultError.toJson(), {
		status: resultError.statusCode,
		headers: { "Content-Type": "application/json; charset=UTF-8" }
	});
});
app.use("*", logger);
app.use("*", responseHandler);
app.use("*", checkSettings);
app.route("/settings", settings);
app.route("/users", usersController);
app.route("/groups", groupsController);
app.route("/channels", channelsController);
app.route("/user-confirmation-request", authRequestController);
app.route("/notify", notifyController);
app.route("/login", loginController);
app.route("/bot", botController);

settingsService.loadConfig().then(() => {
	const appListenService = di.inject("AppListenService");
	serve({ fetch: app.fetch , port }, (info) => {
		appListenService.listen(info);
		// warming up the bot immediately, so it can initialize everything before requests
		di.inject("Bot");
	});
});
