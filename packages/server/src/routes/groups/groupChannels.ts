import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import type { FastifyInstance } from "fastify";
import { channelNameSchema } from "@shared/models/Channel";
import { inject } from "src/injection";

export function groupChannels<Instace extends FastifyInstance>(fastify: Instace) {
	const channelToGroupRelationsRepository = inject("ChannelToGroupRelationsRepository");

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/groups/:groupId/channels",
		schema: {
			params: z.object({
				groupId: z.number({ coerce: true }).int().gt(0),
			}),
			body: z.object({
				name: channelNameSchema,
			}),
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { groupId } = req.params;
			const { name } = req.body;

			await channelToGroupRelationsRepository.connectOrCreateChannelToGroup(groupId, name);

			fastify.log.info(`Group channel connected by ${req.user.id}-${req.user.name}`, groupId, name);
			return reply.send(result(null));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/groups/:groupId/channels",
		schema: {
			querystring: z.object({ id: z.optional(batchIdsSchema) }),
			params: z.object({
				groupId: z.number({ coerce: true }).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
				404: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { groupId } = req.params;
			const ids = parseIds(req.query.id || "");
			// orphaned user-to-channel relations handled by a db trigger
			const count = ids?.length
				? await channelToGroupRelationsRepository.deleteChannelsFromGroupByIds(groupId, ids)
				: await channelToGroupRelationsRepository.deleteAllChannelsFromGroup(groupId);
			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`Group channels batch disconnect by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});
}