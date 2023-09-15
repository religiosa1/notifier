import z from "zod";
import fp from "fastify-plugin";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { channelNameSchema } from "@shared/models/Channel";
import type { IBot } from "src/Bot/Models";
import { ResultError, result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { db } from "src/db";
import { inject } from "src/injection";

interface NotifyOptions {
	bot: IBot
}
export default fp<NotifyOptions>(async function (fastify) {
	const bot = inject("Bot");
	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/notify",
		schema: {
			body: z.object({
				channels: z.union([
					channelNameSchema,
					z.array(channelNameSchema)
				]),
				message: z.string(),
			}),
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema,
				422: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeAnyMethod,
		async handler(req, reply) {
			if (!bot) {
				throw new ResultError(503, "Bot isn't initialized");
			}
			const channels = Array.isArray(req.body.channels)
				? req.body.channels
				: [req.body.channels];
			const chats = await db.user.findMany({
				select: { telegramId: true },
				where: {
					channels: {
						some: {
							channel: { name: { in: channels } }
						}
					}
				}
			});
			if (!chats.length) {
				throw new ResultError(404, "Can't find anyone to send the data to in the provided channels");
			}

			await bot.broadcastMessage(
				chats.map(i => i.telegramId),
				{ text: req.body.message }
			);
			return reply.send(result(null));
		}
	});
});