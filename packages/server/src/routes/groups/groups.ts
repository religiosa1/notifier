import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import * as GroupModel from "@shared/models/Group";
import { counted } from "@shared/models/Counted";
import { paginationSchema, paginationDefaults } from "@shared/models/Pagination";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
// import { handlerDbNotFound } from "src/error/handlerRecordNotFound";
// import { handlerUniqueViolation } from "src/error/handlerUniqueViolation";
import { groupUsers } from "./groupUsers";
import { groupChannels } from "src/routes/groups/groupChannels";
import { removeRestricredChannels } from "src/services/UserChannels";
import { inject } from "src/injection";
import { and, eq, getTableColumns, ilike, inArray, isNull, sql } from "drizzle-orm";
import { schema } from "src/db";
import { assert } from "src/util/assert";

export default fp(async function (fastify) {
	const dbm = inject("db");
	// const groupNotFound = (id: string | number) => `group with id '${id}' doesn't exist`;

	const countGroupsQuery = dbm.prepare((db) => db.select({ count: sql<number>`count(*)::int`})
		.from(schema.groups)
		.prepare("count_groups_query")
	);
	const groupsQuery = dbm.prepare((db) => db.select({
			...getTableColumns(schema.groups),
			channelsCount: sql<number>`count(${schema.channelsToGroups.channelId})::int`,
			usersCount: sql<number>`count(${schema.usersToGroups.userId})::int`
		}).from(schema.groups)
			.leftJoin(schema.channelsToGroups, eq(schema.channelsToGroups.groupId, schema.groups.id))
			.leftJoin(schema.usersToGroups, eq(schema.usersToGroups.groupId, schema.groups.id))
			.groupBy(schema.groups.id)
		.prepare("groups_query")
	);
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
			const [
				[{count = -1} = {}],
				groups
			] = await Promise.all([
				countGroupsQuery.value.execute(),
				groupsQuery.value.execute({ skip, take }),
			]);

			return reply.send(result({
				count,
				data: groups
			}));
		}
	});

	const createGroupQuery = dbm.prepare(db => db.insert(schema.groups)
		.values({ name: sql.placeholder("name") })
		.returning({ id: schema.groups.id })
		.prepare("create_group_query")
	);
	const retrieveGroupQuery = dbm.prepare(db => db.query.groups.findFirst({
		where: eq(schema.groups.id, sql.placeholder("id")),
		with: {
			channels: { with: { channel: true } },
			users: { with: { user: {
				columns: {
					id: true,
					name: true
				}
			}}}
		}
	}).prepare("retrieve_group_query"))
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
			const [ { id } = { id: undefined } ] = await createGroupQuery.value.execute({ name });
			assert(id);
			const group = await retrieveGroupQuery.value.execute({ id });
			assert(group);
			// catch(handlerUniqueViolation());
			fastify.log.info(`Group created by ${req.user.id}-${req.user.name}`, group);
			return reply.send(result({
				...group,
				users: group.users.map(i => i.user),
				channels: group.channels.map(i => i.channel)
			}));
		}
	});

	const deleteGroupsQuery = dbm.prepare((db) => db.delete(schema.groups)
		.where(inArray(schema.groups.id, sql.placeholder("ids")))
		.returning({ count: sql<number>`count(*)::int` })
		.prepare("delete_group_query")
	);
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
			const db = dbm.connection;
			const ids = parseIds(req.query.id);
			const count = await db.transaction(async (tx) => {
				const [{ count = -1} ={}] = await deleteGroupsQuery.value.execute({ids});
				await removeRestricredChannels(tx);
				return count;
			});
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
			const db = dbm.connection;
			const { name, channel, user } = req.query;

			const groupsQuery = db.select(getTableColumns(schema.groups)).from(schema.groups);
			const whereClasues = [
				ilike(schema.groups.name, name ?? ""),
			];
			if (channel) {
				groupsQuery.leftJoin(schema.channelsToGroups, and(
					eq(schema.channelsToGroups.groupId, schema.groups.id),
					eq(schema.channelsToGroups.channelId, channel)
				));
				whereClasues.push(isNull(schema.channelsToGroups.groupId));
			}
			if (user) {
				groupsQuery.innerJoin(schema.usersToGroups, and(
					eq(schema.usersToGroups.groupId, schema.groups.id),
					eq(schema.usersToGroups.userId, user)
				));
				whereClasues.push(isNull(schema.usersToGroups.groupId));
			}
			groupsQuery.where(and(...whereClasues));

			const groups = await groupsQuery;
			return reply.send(result(groups));
		}
	});

	const getGroupDetailQuery = dbm.prepare(db => db.query.groups.findFirst({
		where: eq(schema.groups.id, sql.placeholder("id")),
		with: {
			users: { with: { user: {
				columns: {
					id: true,
					name: true,
				}
			}}},
			channels: { with: { channel: {
				columns: {
					id: true,
					name: true
				}
			}}}
		}
	}).prepare("get_group_detail_query"))
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
			const group = await getGroupDetailQuery.value.execute({ id });
			assert(group);
			//.catch(handlerDbNotFound(groupNotFound(id)));
			return reply.send(result({
				...group,
				users: group.users.map(i => i.user),
				channels: group.channels.map(i => i.channel),
			}));
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
			const db = dbm.connection;
			const id = req.params.groupId;
			const { name } = req.body;
			const [group] = await db.update(schema.groups).set({
				name,
				updatedAt: sql`CURRENT_TIMESTAMP`
			})
				.where(eq(schema.groups.id, id))
				.returning();
			assert(group);
				// .catch(handlerDbNotFound(groupNotFound(id)))
				// .catch(handlerUniqueViolation());
			fastify.log.info(`Group update by ${req.user.id}-${req.user.name}`, group);
			return reply.send(result(group));
		}
	});

	const deleteGroupQuery = dbm.prepare(db => db.delete(schema.groups)
		.where(eq(schema.groups.id, sql.placeholder("id")))
		.returning()
		.prepare("delete_group_query")
	);
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
			const db = dbm.connection;
			const id = req.params.groupId;
			const group = await db.transaction(async (tx) => {
				const [group] = await deleteGroupQuery.value.execute({ id });
				await removeRestricredChannels(tx);
				return group;
			});
			assert(group);
			// }).catch(handlerDbNotFound(groupNotFound(id)));
			fastify.log.info(`Group delete by ${req.user.id}-${req.user.name}`, group);
			return reply.send(result(null));
		}
	});

	groupUsers(fastify);
	groupChannels(fastify);
});