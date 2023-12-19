import "dotenv/config";
import "./src/polyfill";

import { Hono } from "hono";
import { serve } from '@hono/node-server'

// import { ResultError } from "@shared/models/Result";
import { Bot, type Update } from "src/Bot";
import usersController from "src/routes/users";
import groupsController from "src/routes/groups";
import channelsController from "src/routes/channels";
import notifyController from "src/routes/notify";
import authRequestController from "src/routes/user-confirmation-request";
import loginController from "src/routes/login";

import { inject, register } from "src/injection";
import { checkSettings } from "src/middleware/checkSettings";
import settings from "src/routes/settings";
import { responseHandler } from "src/middleware/responseHandler";

const url = process.env.URL || "";
const port = Number(process.env.PORT) || 8085;

if (process.env.NODE_ENV === "production" && !url) {
	throw new Error("Public URL for the bot wasn't supplied through environment variables");
}

const settingsService = inject("SettingsService");
const logger = inject("logger");

const app = new Hono();

app.use("*", responseHandler);
app.use("*", checkSettings);
app.route("/settings", settings);
app.route("/users", usersController);
app.route("/groups", groupsController);
app.route("/channels", channelsController);
app.route("/user-confirmation-request", authRequestController);
app.route("/notify", notifyController);
app.route("/login", loginController);

// app.setErrorHandler(function (error, _, reply) {
// 	this.log.error(error);
// 	const err = error instanceof ResultError ? error : ResultError.from(error);
// 	reply.status(err.statusCode).send(err.toJson());
// })

app.post("/bot*", async (c) => {
		const bot = inject("Bot");
		const { botToken } = settingsService.getConfig() ?? {};
		if (!bot || !botToken || !new URL(c.req.url).hostname.endsWith(botToken)) {
			logger.info("Bot isn't initialized, can't process bot webhook requests");
			return;
		}
		const data = await c.req.json();
		bot.processUpdate(data as Update)
	},
);

settingsService.subscribe(async (settings) => {
	const { botToken } = settings || {};
	if (!botToken) {
		register("Bot", undefined);
		logger.warn("No bot token is present, bot is NOT initialized");
		return;
	}

	logger.info("Initializing the bot");
	const bot = new Bot(botToken);

	await bot.init();
	register("Bot", bot);

	logger.info("Bot initialized");
	const appListenService = inject("AppListenService");
	await appListenService.listening();
	logger.info(`Setting webhook on ${url}/bot${botToken}`);
	const  d = await bot.setWebHook(`${url}/bot${botToken}`);
	logger.info("Webhook is set", d);
	return () => bot.destroy();
}, [ "botToken" ]);

const start = async () => {
	await settingsService.loadConfig();
	serve({ fetch: app.fetch , port }, (info) => {
		console.log(`App is listening on ${info.family}://${info.address}:${info.port}/`)
	}).on("close", () => {
		console.log("App is closed");
	});
}
start();
