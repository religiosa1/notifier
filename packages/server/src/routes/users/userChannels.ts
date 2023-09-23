import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import * as ChannelModel from "@shared/models/Channel";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { batchIdsSchema, parseIds } from "@shared/models/batchIds";
import { paginationDefaults, paginationSchema } from "@shared/models/Pagination";
import { counted } from "@shared/models/Counted";
import { inject } from "src/injection";

export function userChannels<Instace extends FastifyInstance>(fastify: Instace) {
	const userToChannelRelationsRepository = inject("UserToChannelRelationsRepository");

	const baseUserChannelsUrl = "/users/:userId/channels";
	const baseUserChannelsParams = z.object({
		userId: z.number({ coerce: true }).int().gt(0),
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: baseUserChannelsUrl,
		schema: {
			params: baseUserChannelsParams,
			querystring: paginationSchema,
			response: {
				200: resultSuccessSchema(counted(z.array(ChannelModel.channelSchema))),
				404: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { userId } = req.params;
			const { skip, take } = { ...paginationDefaults, ...req.query };
			const [data, count] = await userToChannelRelationsRepository.listUserChannels(userId, { skip, take });
			return reply.send(result({ data, count  }));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: '/users/:userId/available-channels',
		schema: {
			params: baseUserChannelsParams,
			querystring: paginationSchema,
			response: {
				200: resultSuccessSchema(z.array(ChannelModel.channelSchema)),
				404: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { userId } = req.params;
			const { skip, take } = { ...paginationDefaults, ...req.query };
			const data = await userToChannelRelationsRepository.listAvailableUnsubscribedChannelsForUser(userId, { skip, take });
			return reply.send(result(data));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: baseUserChannelsUrl,
		schema: {
			params: baseUserChannelsParams,
			body: z.object({ id: z.number({ coerce: true }).int().gt(0) }),
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema,
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { userId } = req.params;
			const channelId = req.body.id;
			await userToChannelRelationsRepository.connectUserChannel(userId, channelId);
			fastify.log.info(`Channel added to user ${req.params.userId} edit by ${req.user.id}-${req.user.name}`, req.body);
			return reply.send(result(null));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: baseUserChannelsUrl,
		schema: {
			querystring: z.object({ id: batchIdsSchema }),
			params: z.object({
				userId: z.number({ coerce: true }).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
				404: resultFailureSchema,
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { userId } = req.params;
			const ids = parseIds(req.query.id);

			const count = await userToChannelRelationsRepository.disconnectUserChannels(userId, ids)
				// .catch(handlerDbNotFound(userNotFound(userId)))

			const data = {
				count,
				outOf: ids.length,
			};
			return reply.send(result(data));
		}
	});
}