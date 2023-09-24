import z from "zod";
import fp from "fastify-plugin";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { channelNameSchema } from "@shared/models/Channel";
import type { IBot } from "src/Bot/Models";
import { ResultError, result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { inject } from "src/injection";

interface NotifyOptions {
	bot: IBot
}
export default fp<NotifyOptions>(async function (fastify) {
	const channelsRepository = inject("ChannelsRepository");

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
			const bot = inject("Bot");
			if (!bot) {
				throw new ResultError(503, "Bot isn't initialized");
			}

			const channels = Array.isArray(req.body.channels)
				? req.body.channels
				: [req.body.channels];

			const chats = await channelsRepository.getUserChatIdsForChannel(channels);

			if (!chats.length) {
				throw new ResultError(404, "Can't find anyone to send the data to in the provided channels");
			}

			await bot.broadcastMessage(
				chats,
				{ text: req.body.message }
			);
			return reply.send(result(null));
		}
	});
});