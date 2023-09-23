import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { ResultError, result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import * as GroupModel from "@shared/models/Group";
import { counted } from "@shared/models/Counted";
import { paginationSchema, paginationDefaults } from "@shared/models/Pagination";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { groupUsers } from "./groupUsers";
import { groupChannels } from "src/routes/groups/groupChannels";
import { inject } from "src/injection";

export default fp(async function (fastify) {
	const groupsRepository = inject("GroupsRepository");

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/groups",
		schema: {
			querystring: paginationSchema,
			response: {
				200: resultSuccessSchema(counted(z.array(GroupModel.groupSchema.extend({
					channelsCount: z.number(),
					usersCount: z.number(),
				})))),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { skip, take } = { ...paginationDefaults, ...req.query };

			const [ data, count ] = await groupsRepository.listGroups({ skip, take });

			return reply.send(result({
				data,
				count,
			}));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/groups",
		schema: {
			body: GroupModel.groupCreateSchema,
			response: {
				200: resultSuccessSchema(GroupModel.groupSchema),
				409: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { name } = req.body;
			const { id } = await groupsRepository.insertGroup(name);
			const group = await groupsRepository.getGroupPreview(id);
			fastify.log.info(`Group created by ${req.user.id}-${req.user.name}`, group);
			return reply.send(result({
				...group,
			}));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/groups",
		schema: {
			querystring: z.object({ id: batchIdsSchema }),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const ids = parseIds(req.query.id);

			const count = await groupsRepository.deleteGroups(ids);

			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`Group batch delete by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});


	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/groups/search",
		schema: {
			querystring: z.object({
				name: z.string().optional(),
				channel: z.number({ coerce: true }).int().gt(0).optional(),
				user: z.number({ coerce: true }).int().gt(0).optional(),
			}),
			response: {
				200: resultSuccessSchema(z.array(GroupModel.groupSchema)),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { name, channel, user } = req.query;

			const groups = await groupsRepository.searchAvailableGroups({
				name,
				channelId: channel,
				userId: user,
			});

			return reply.send(result(groups));
		}
	});

	//============================================================================

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/groups/:groupId",
		schema: {
			params: z.object({
				groupId: z.number({ coerce: true }).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(GroupModel.groupDetailSchema),
				404: resultFailureSchema
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const id = req.params.groupId;
			const group = await groupsRepository.getGroupDetail(id);
			return reply.send(result(group));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "PUT",
		url: "/groups/:groupId",
		schema: {
			params: z.object({
				groupId: z.number({ coerce: true }).int().gt(0),
			}),
			body: GroupModel.groupUpdateSchema,
			response: {
				200: resultSuccessSchema(GroupModel.groupSchema),
				404: resultFailureSchema,
				409: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const id = req.params.groupId;
			const { name } = req.body;
			const group = await groupsRepository.updateGroup(id, name);
			fastify.log.info(`Group update by ${req.user.id}-${req.user.name}`, group);
			return reply.send(result(group));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/groups/:groupId",
		schema: {
			params: z.object({
				groupId: z.number({ coerce: true }).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const id = req.params.groupId;
			const count = await groupsRepository.deleteGroups([ id ]);
			if (!count) {
				throw new ResultError(404, `Group with id "${id}" not foind`);
			}
			fastify.log.info(`Group delete by ${req.user.id}-${req.user.name}`, id);
			return reply.send(result(null));
		}
	});

	groupUsers(fastify);
	groupChannels(fastify);
});