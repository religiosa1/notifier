import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { paginationSchema, paginationDefaults } from "@shared/models/Pagination";
import * as UserModel from "@shared/models/User";
import { counted } from "@shared/models/Counted";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";

import { userChannels } from "./userChannels";
import { userGroups } from "./userGroups";
import { userKeys } from "./userKeys";
import { inject } from "src/injection";

export default fp(async function (fastify) {
	const usersRepository = inject("UsersRepository");

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/users",
		schema: {
			querystring: paginationSchema,
			response: {
				200: resultSuccessSchema(counted(z.array(UserModel.userWithGroupsSchema))),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { skip, take } = { ...paginationDefaults, ...req.query };
			const { count, users } = await usersRepository.listUsers({ skip, take });

			return reply.send(result({
				count,
				data: users,
			}));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/users",
		schema: {
			body: UserModel.userCreateSchema,
			response: {
				200: resultSuccessSchema(UserModel.userDetailSchema),
				409: resultFailureSchema,
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const user = await usersRepository.insertUser(req.body)
			fastify.log.info(`User create by ${req.user.id}-${req.user.name}`, req.body);
			return reply.send(result(user));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/users",
		schema: {
			querystring: z.object({ id: batchIdsSchema }),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const ids = parseIds(req.query.id);
			const count = await usersRepository.deleteUsers(ids);
			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`User batch delete by ${req.user.id}-${req.user.name}`, ids, data);
			return reply.send(result(data));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/users/:userId",
		schema: {
			params: z.object({
				userId: z.number({ coerce: true }).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(UserModel.userDetailSchema),
				404: resultFailureSchema
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const id = req.params.userId;
			const user = await usersRepository.getUserDetail(id);
			return reply.send(result(user));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "PUT",
		url: "/users/:userId",
		schema: {
			params: z.object({
				userId: z.number({ coerce: true }).int().gt(0),
			}),
			body: UserModel.userUpdateSchema,
			response: {
				200: resultSuccessSchema(UserModel.userDetailSchema),
				404: resultFailureSchema,
				409: resultFailureSchema,
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { userId } = req.params;
			const user = await usersRepository.updateUser(userId, req.body)

			fastify.log.info(`User ${userId} edit by ${req.user.id}-${req.user.name}`, req.body);
			return reply.send(result(user));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/users/:userId",
		schema: {
			params: z.object({
				userId: z.number({ coerce: true }).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const id = req.params.userId;
			await usersRepository.assertUserExists(id);
			await usersRepository.deleteUsers([id])
			fastify.log.info(`User ${id} delete by ${req.user.id}-${req.user.name}`);
			return reply.send(result(null));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/users/search",
		schema: {
			querystring: z.object({
				name: z.string().optional(),
				group: z.number({ coerce: true }).int().gt(0).optional(),
			}),
			response: {
				200: resultSuccessSchema(z.array(UserModel.userSchema)),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { name, group } = req.query;
			const users = await usersRepository.searchUsers({ name, groupId: group });
			return reply.send(result(users));
		}
	});

	userChannels(fastify);
	userGroups(fastify);
	userKeys(fastify);
});


