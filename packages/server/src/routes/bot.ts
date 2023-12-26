import type { Update } from "node-telegram-bot-api";
import { Hono } from "hono";
import { di } from "src/injection";

import { ResultError } from "@shared/models/Result";

const controller = new Hono();

controller.post("*", async (c) => {
		const { bot, botToken: token } = di.inject("Bot").getInstanceAndToken() ?? {};
		const logger = di.inject("logger");		
		if (!bot) {
			throw new ResultError(503, "Bot isn't ready to process incoming requests");
		}
		if (token && !new URL(c.req.url).pathname.endsWith(token)) {
			logger.info("Someone tried to call the bot webhook on a nonexisting url", c.req);
			return c.text('');
		}
		const data: Update = await c.req.json();
		bot.processUpdate(data);
		return c.text('');
	},
);

export default controller;