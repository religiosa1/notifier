import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "src/db";
import * as ChannelModel from "src/models/Channel";
import type { FastifyInstance } from "fastify";
import { result, resultFailureSchema, resultSuccessSchema } from "src/models/Result";
import { handlerDbNotFound } from "src/error/handlerRecordNotFound";
import { batchOperationStatsSchema } from "src/models/BatchOperationStats";
import { batchIdsSchema, parseIds } from "src/models/batchIds";
import { paginationDefaults, paginationSchema } from "src/models/Pagination";
import { counted } from "src/models/Counted";
import * as UserChannelsService from "src/services/UserChannels";

export function userChannels<Instace extends FastifyInstance>(fastify: Instace) {
	const userNotFound = (id: string | number) => `user with id '${id}' doesn't exist`;
	const baseUserChannelsUrl = "/users/:userId/channels";
	const baseUserChannelsParams = z.object({
		userId: z.number({ coerce: true}).int().gt(0),
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
			const { skip, take } = {...paginationDefaults, ...req.query };
			const [ data, count ] = await UserChannelsService.getUserChannels(db, userId, { skip, take });
			return reply.send(result({ count, data }));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: '/users/:userId/available-channels',
		schema: {
			params: baseUserChannelsParams,
			response: {
				200: resultSuccessSchema(z.array(ChannelModel.channelSchema)),
				404: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { userId } = req.params;

			const data = await UserChannelsService.availableChannels(db, userId);
			return reply.send(result(data));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: baseUserChannelsUrl,
		schema: {
			params: baseUserChannelsParams,
			body: z.object({ id:  z.number({ coerce: true}).int().gt(0) }),
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema,
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { userId } = req.params;
			const channelId = req.body.id;
			await UserChannelsService.connectUserChannel(db, userId, channelId);
			fastify.log.info(`Channel added to user ${req.params.userId} edit by ${req.user.id}-${req.user.name}`, req.body);
			return reply.send(result(null));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: baseUserChannelsUrl,
		schema: {
			querystring: z.object({ id: batchIdsSchema}),
			params: z.object({
				userId: z.number({ coerce: true}).int().gt(0),
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

			const {count} = await UserChannelsService.disconnectUserChannels(db, userId, ids)
				.catch(handlerDbNotFound(userNotFound(userId)))

			const data = {
				count,
				outOf: ids.length,
			};
			return reply.send(result(data));
		}
	});
}