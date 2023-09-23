import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import * as ChannelModel from "@shared/models/Channel";
import { counted } from "@shared/models/Counted";
import { paginationSchema, paginationDefaults } from "@shared/models/Pagination";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";

import { inject } from "src/injection";

export default fp(async function (fastify) {
	const channelsRepository = inject("ChannelsRepository");

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/channels",
		schema: {
			querystring: paginationSchema,
			response: {
				200: resultSuccessSchema(counted(z.array(ChannelModel.channelSchema.extend({
					usersCount: z.number(),
					groupsCount: z.number(),
				})))),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { skip, take } = { ...paginationDefaults, ...req.query };
			const [ data, count ] = await channelsRepository.listChannels({ skip , take });

			return reply.send(result({
				data,
				count,
			}));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/channels/search",
		schema: {
			querystring: z.object({
				name: z.string().optional(),
				group: z.number({ coerce: true }).int().gt(0).optional(),
			}),
			response: {
				200: resultSuccessSchema(z.array(ChannelModel.channelSchema)),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { group, name = "" } = req.query;

			const channels = group
				? await channelsRepository.searchChannelsForGroup({ name, groupId: group })
				: await channelsRepository.searchChannels({ name });

			return reply.send(result(channels));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/channels",
		schema: {
			body: ChannelModel.channelCreateSchema,
			response: {
				200: resultSuccessSchema(ChannelModel.channelSchema),
				409: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const channel = await channelsRepository.insertChannel(req.body.name);
			fastify.log.info(`Channel created by ${req.user.id}-${req.user.name}`, channel);
			return reply.send(result(channel));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/channels/:channelId",
		schema: {
			params: z.object({
				channelId: z.number({ coerce: true }).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(ChannelModel.channelDetailSchema),
				404: resultFailureSchema
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const {channelId} = req.params;
			const channel = await channelsRepository.getChannelDetail(channelId);
			return reply.send(result(channel));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "PUT",
		url: "/channels/:channelId",
		schema: {
			params: z.object({
				channelId: z.number({ coerce: true }).int().gt(0),
			}),
			body: ChannelModel.channelUpdateSchema,
			response: {
				200: resultSuccessSchema(ChannelModel.channelSchema),
				404: resultFailureSchema,
				409: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const id = req.params.channelId;
			const { name } = req.body;

			const channel = await channelsRepository.updateChannel(id, name);

			fastify.log.info(`Channel update by ${req.user.id}-${req.user.name}`, channel);
			return reply.send(result(channel));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/channels/:channelId",
		schema: {
			params: z.object({
				channelId: z.number({ coerce: true }).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const id = req.params.channelId;
			await channelsRepository.assertChannelExist(id);
			await channelsRepository.deleteChannels([id]);
			fastify.log.info(`Channel delete by ${req.user.id}-${req.user.name}`, id);
			return reply.send(result(null));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/channels",
		schema: {
			querystring: z.object({ id: batchIdsSchema }),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const ids = parseIds(req.query.id);
			const count = await channelsRepository.deleteChannels(ids);
			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`Channel batch delete by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});
});
