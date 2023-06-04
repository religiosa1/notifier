import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "src/db";
import { result, resultFailureSchema, resultSuccessSchema } from "src/models/Result";
import { paginationSchema, paginationDefaults } from "src/models/Pagination";
import * as UserModel from "src/models/User";
import { counted } from "src/models/Counted";
import { parseIds, batchIdsSchema } from "src/models/batchIds";
import { batchOperationStatsSchema } from "src/models/BatchOperationStats";
import { handlerDbNotFound } from "src/error/handlerRecordNotFound";
import { handlerUniqueViolation } from "src/error/handlerUniqueViolation";
import * as UserService from "src/services/UserService";

import { userChannels } from "./userChannels";
import { userGroups } from "./userGroups";
import { userKeys } from "./userKeys";

export default fp(async function(fastify) {
	const userNotFound = (id: string | number) => `user with id '${id}' doesn't exist`;
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
			const { skip, take } = {...paginationDefaults, ...req.query };
			// why Prisma is so stupid?..
			// https://github.com/prisma/prisma/issues/7550
			const [ count, users ] = await db.$transaction([
				db.user.count(),
				db.user.findMany({
					skip,
					take,
					include: {
						groups: {
							select: { id: true, name: true }
						}
					}
				}),
			]);
			return reply.send(result({
				count,
				data: users as UserModel.UserWithGroups[],
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
			const user = await UserService.createUser(db, req.body)
				.catch(handlerUniqueViolation()) as UserModel.UserDetail;
			fastify.log.info(`User create by ${req.user.id}-${req.user.name}`, req.body);
			return reply.send(result(user));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/users",
		schema: {
			querystring: z.object({ id: batchIdsSchema}),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const ids = parseIds(req.query.id);
			const count = await UserService.deleteUsers(db, ids);
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
				userId: z.number({ coerce: true}).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(UserModel.userDetailSchema),
				404: resultFailureSchema
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const id = req.params.userId;
			const user = await UserService.getUser(db, id)
				.catch(handlerDbNotFound(userNotFound(id)));
			return reply.send(result(user));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "PUT",
		url: "/users/:userId",
		schema: {
			params: z.object({
				userId: z.number({ coerce: true}).int().gt(0),
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
			const {userId} = req.params;
			const user = await UserService.editUser(db, userId, req.body)
				.catch(handlerDbNotFound(userNotFound(userId)))
				.catch(handlerUniqueViolation()) as UserModel.UserDetail;
			fastify.log.info(`User ${userId} edit by ${req.user.id}-${req.user.name}`, req.body);
			return reply.send(result(user));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/users/:userId",
		schema: {
			params: z.object({
				userId: z.number({ coerce: true}).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const id = req.params.userId;
			await UserService.deleteUsers(db, [id])
				.catch(handlerDbNotFound(userNotFound(id)));
			fastify.log.info(`User ${id} delete by ${req.user.id}-${req.user.name}`);
			return reply.send(result(null));
		}
	});

	userChannels(fastify);
	userGroups(fastify);
	userKeys(fastify);
});


