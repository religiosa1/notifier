
import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { inject } from "src/injection";
import { groupNameSchema } from "@shared/models/Group";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { batchIdsSchema, parseIds } from "@shared/models/batchIds";

export default fp(async function (fastify) {
	const channelsRepository = inject("ChannelsRepository");
	const channelToGroupRelationsRepository = inject("ChannelToGroupRelationsRepository");

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/channels/:channelId/groups",
		schema: {
			params: z.object({
				channelId: z.number({ coerce: true }).int().gt(0),
			}),
			body: z.object({
				name: groupNameSchema,
			}),
			response: {
				200: resultSuccessSchema(z.null()),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { name } = req.body;
			const { channelId } = req.params;
			await channelToGroupRelationsRepository.connectOrCreateGroupToChannel(channelId, name);
			fastify.log.info(`Channel group added by ${req.user.id}-${req.user.name}`, channelId, name);
			return reply.send(result(null));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/channels/:channelId/groups",
		schema: {
			params: z.object({
				channelId: z.number({ coerce: true }).int().gt(0),
			}),
			querystring: z.object({ id: z.optional(batchIdsSchema) }),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
				404: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { channelId } = req.params;
			const ids = parseIds(req.query.id || "");

			await channelsRepository.assertChannelExist(channelId);

			const count = ids.length
				? await channelToGroupRelationsRepository.disconnectGroupsFromChannelByIds(channelId, ids)
				: await channelToGroupRelationsRepository.disconnectAllGroupsFromChannel(channelId)

			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`Channel groups batch disconnect by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});
})