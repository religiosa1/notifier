import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { paginationSchema, paginationDefaults } from "@shared/models/Pagination";
import * as UserModel from "@shared/models/User";
import { counted } from "@shared/models/Counted";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { handlerDbNotFound } from "src/error/handlerRecordNotFound";
import { handlerUniqueViolation } from "src/error/handlerUniqueViolation";
import * as UserService from "src/services/UserService";

import { userChannels } from "./userChannels";
import { userGroups } from "./userGroups";
import { userKeys } from "./userKeys";
import { inject } from "src/injection";
import { getTableColumns, ilike, sql, and, eq, isNull } from "drizzle-orm";
import { schema } from "src/db";

export default fp(async function (fastify) {
	const dbm = inject("db");

	const countUsersQuery = dbm.prepare((db) => db.select({ count: sql<number>`count(*)`})
		.from(schema.users)
		.prepare("count_users_query")
	);
	const getUsersQuery = dbm.prepare((db) => db.query.users.findMany({
		limit: sql.placeholder("take"),
		offset: sql.placeholder("skip"),
		with: {
			groups: { with: { group: {
				columns: {
					id: true,
					name: true,
				}
			}}}
		}
	}).prepare("get_users_query"))
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
			const { skip, take } = { ...paginationDefaults, ...req.query };
			const [
				[ { count = -1} = {}],
				users
			] = await Promise.all([
				countUsersQuery.value.execute(),
				getUsersQuery.value.execute({ skip, take }),
			])
			return reply.send(result({
				count,
				data: users.map(user => ({
					...user,
					groups: user.groups.map(g => g.group),
				}))
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
			const user = await UserService.createUser(req.body)
				.catch(handlerUniqueViolation()) as UserModel.UserDetail;
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
			const count = await UserService.deleteUsers(ids);
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
			const user = await UserService.getUser(id)
				.catch(handlerDbNotFound(userNotFound(id)));
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
			const user = await UserService.editUser(userId, req.body)
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
			await UserService.deleteUsers([id])
				.catch(handlerDbNotFound(userNotFound(id)));
			fastify.log.info(`User ${id} delete by ${req.user.id}-${req.user.name}`);
			return reply.send(result(null));
		}
	});

	const searchUsersQuery = dbm.prepare((db) => db.select().from(schema.users)
		.where(ilike(schema.users.name, sql.placeholder("name")))
		.prepare("search_users_query")
	);

	const searchUsersForGroup = dbm.prepare((db) => db.select(getTableColumns(schema.users)).from(schema.users)
		.leftJoin(schema.usersToGroups, eq(schema.usersToGroups.userId, schema.users.id))
		.where(and(
			ilike(schema.users.name, sql.placeholder("name")),
			isNull(schema.usersToGroups.groupId)
		))
		.prepare("search_users_for_group")
	);

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
			const query = group ? searchUsersForGroup : searchUsersQuery;
			const users = await query.value.execute({ name, group });
			return reply.send(result(users));
		}
	});

	userChannels(fastify);
	userGroups(fastify);
	userKeys(fastify);
});


