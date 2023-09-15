import "dotenv/config";
import "./src/polyfill";
import fastify from "fastify";
import middie from "@fastify/middie";
import cookie, { FastifyCookieOptions } from '@fastify/cookie'
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { ResultError } from "@shared/models/Result";
import authorization from "src/Authorization";
import { Bot, Update } from "src/Bot";
import usersRoutes from "src/routes/users";
import groupsRoutes from "src/routes/groups";
import channelsRoutes from "src/routes/channels";
import notify from "src/routes/notify";
import authRequest from "src/routes/auth-request";
import { inject, register } from "src/injection";
import { checkSettings } from "src/middleware/checkSettings";
import settings from "src/routes/settings";

const prefix = process.env.URL || "";
const url = process.env.URL || "";
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT) || 8085;

if (process.env.NODE_ENV === "production" && !url) {
	throw new Error("Public URL for the bot wasn't supplied through environment variables");
}

const settingsService = inject("SettingsService");

async function build() {
	const app = fastify({ logger: true });
	register("logger", app.log);
	await app.register(middie);

	app.register(cookie, {
		secret: process.env.JWT_SECRET,
		hook: false,
	} satisfies FastifyCookieOptions);

	app.register(authorization);
	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	app.register(settings);
	app.use(checkSettings);
	app.register(usersRoutes, { prefix });
	app.register(groupsRoutes, { prefix });
	app.register(channelsRoutes, { prefix });
	app.register(authRequest, { prefix });
	app.register(notify);

	app.setErrorHandler(function (error, _, reply) {
		this.log.error(error);
		const err = error instanceof ResultError ? error : ResultError.from(error);
		reply.status(err.statusCode).send(err.toJson());
	})

	app.route({
		method: 'POST',
		url: `/bot*`,
		handler: async (req) => {
			const bot = inject("Bot");
			const { botToken } = settingsService.getConfig() ?? {};
			if (!bot || !botToken || !new URL(req.url).hostname.endsWith(botToken)) {
				app.log.info("Bot isn't initialized, can't process bot webhook requests");
				return;
			}
			bot.processUpdate(req.body as Update)
		},
	});


	settingsService.subscribe(async (settings) => {
		const { botToken } = settings || {};
		if (!botToken) {
			register("Bot", undefined);
			app.log.warn("No bot token is present, bot is NOT initialized");
			return;
		}

		app.log.info("Initializing the bot");
		const bot = new Bot(botToken);

		await bot.init();
		register("Bot", bot);

		app.log.info("Bot initialized");
		const appListenService = inject("AppListenService");
		await appListenService.listening();
		app.log.info(`Setting webhook on ${url}/bot${botToken}`);
		const  d = await bot.setWebHook(`${url}/bot${botToken}`);
		app.log.info("Webhook is set", d);
		return () => bot.destroy();
	}, [ "botToken" ]);

	return app;
}

const start = async () => {
	const app = await build();
	try {
		await settingsService.loadConfig();
		await app.listen({ host, port });
	} catch (err) {
		app.log.error(err);
		process.exit(1);
	}
}
start();

