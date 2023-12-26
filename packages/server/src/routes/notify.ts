import { Hono } from 'hono'
import z from "zod";
import { zValidator } from '@hono/zod-validator'
import { validationErrorHook } from 'src/middleware/validationErrorHandlers';

import { channelNameSchema } from "@shared/models/Channel";
import { ResultError } from "@shared/models/Result";
import { di } from "src/injection";

import { authorizeAnyMethod } from 'src/middleware/authorizeAnyMethod';

const controller = new Hono();

controller.use('*', authorizeAnyMethod);

controller.post("/",
	zValidator("json", z.object({
		channels: z.union([
			channelNameSchema,
			z.array(channelNameSchema),
		]),
		message: z.string(),
	}), validationErrorHook),
	async (c) => {
		const channelsRepository = di.inject("ChannelsRepository");
		const bot = di.inject("Bot").instance;
		if (!bot) {
			throw new ResultError(503, "Bot isn't initialized");
		}
		const body = c.req.valid('json');
		const channels = Array.isArray(body.channels) ? body.channels : [body.channels];

		const chats = await channelsRepository.getUserChatIdsForChannel(channels);

		if (!chats.length) {
			throw new ResultError(404, "Can't find anyone to send the data to in the provided channels");
		}

		console.log("SENDING MESSAGE...")
		await bot.broadcastMessage(
			chats,
			{ text: body.message }
		);
		console.log("MESSAGE SENT")
		return c.json(null);
	}
);

export default controller;
