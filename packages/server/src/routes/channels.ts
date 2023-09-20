import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import * as ChannelModel from "@shared/models/Channel";
import { counted } from "@shared/models/Counted";
import { paginationSchema, paginationDefaults } from "@shared/models/Pagination";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { groupNameSchema } from "@shared/models/Group";
import { inject } from "src/injection";
import { schema } from "src/db";
import { sql, eq, getTableColumns, and, ilike, isNull, inArray } from "drizzle-orm";
import {assert} from "src/util/assert";

export default fp(async function (fastify) {
	const dbm = inject("db");

	const countChannelsQuery = dbm.prepare(db => db.select({ count: sql<number>`count(*)::int` })
		.from(schema.channels).prepare("count_channels_query")
	);
	const channeslQuery = dbm.prepare(db => db.select({
			...getTableColumns(schema.channels),
			usersCount: sql<number>`COUNT(${schema.usersToChannels.userId})::int`,
			groupsCount: sql<number>`COUNT(${schema.channelsToGroups.groupId})::int`,
		}).from(schema.channels)
			.innerJoin(schema.usersToChannels, eq(schema.usersToChannels.channelId, schema.channels.id))
			.innerJoin(schema.channelsToGroups, eq(schema.channelsToGroups.channelId, schema.channels.id))
			.groupBy(schema.channels.id)
			.limit(sql.placeholder("take"))
			.offset(sql.placeholder("skip"))
			.prepare("channels_query")
	);
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
			const [
				[{count = -1} = {}],
				channels
			] = await Promise.all([
				countChannelsQuery.value.execute(),
				channeslQuery.value.execute({ skip, take }),
			]);

			return reply.send(result({
				count,
				data: channels,
			}));
		}
	});

	const channelSearchQuery = dbm.prepare(db => db.select().from(schema.channels)
		.where(ilike(schema.channels.name, sql.placeholder("name")))
		.prepare("channel_search_query")
	);
	const channelSearchQueryForGroup = dbm.prepare(db => db.select(getTableColumns(schema.channels))
		.from(schema.channels)
		.leftJoin(schema.channelsToGroups, and(
			eq(schema.channelsToGroups.channelId, schema.channels.id),
			eq(schema.channelsToGroups.groupId, sql.placeholder("group"))
		))
		.where(and(
			ilike(schema.channels.name, sql.placeholder("name")),
			isNull(schema.channelsToGroups.groupId)
		))
		.prepare("channel_search_query_for_group")
	);
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
				? await channelSearchQueryForGroup.value.execute({ group, name })
				: await channelSearchQuery.value.execute({ name });

			return reply.send(result(channels));
		}
	});

	const createChannelQuery = dbm.prepare((db) => db.insert(schema.channels)
		.values({ name: sql.placeholder("name")})
		.returning()
		.prepare("create_channel_query")
	);
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
			const [channel] = await createChannelQuery.value.execute({ name: req.body.name });
			if (!channel) {
				throw new Error(); // TODO
			}
			// .catch(handlerUniqueViolation());
			fastify.log.info(`Channel created by ${req.user.id}-${req.user.name}`, channel);
			return reply.send(result(channel));
		}
	});


	const getChannelQuery = dbm.prepare(db => db.query.channels.findFirst({
		where: eq(schema.channels.id, sql.placeholder("channelId")),
		with: {
			groups: {
				with: {
					group: true
				}
			}
		}
	}).prepare("get_channel_query"));
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
			const channel = await getChannelQuery.value.execute({ channelId });
			if (!channel) {
				throw new Error() // TODO
				// (handlerDbNotFound(channelNotFound(id)))
			}
			return reply.send(result({
				...channel,
				groups: channel.groups.map(i => i.group) ?? []
			}));
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
			const db = dbm.connection;
			const id = req.params.channelId;
			const { name } = req.body;
			const [channel] = await db.update(schema.channels)
				.set({ name, updatedAt: sql`CURRENT_TIMESTAMP` })
				.where(eq(schema.channels.id, id))
				.returning();
			if (!channel) {
				throw new Error(); // TODO
			}
				// .catch(handlerDbNotFound(channelNotFound(id)))
				// .catch(handlerUniqueViolation());
			fastify.log.info(`Channel update by ${req.user.id}-${req.user.name}`, channel);
			return reply.send(result(channel));
		}
	});

	const deleteChannelQuery = dbm.prepare((db) => db.delete(schema.channels)
		.where(eq(schema.channels.id, sql.placeholder("id")))
		.returning()
		.prepare("delete_channel_query")
	);
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
			const channel = await deleteChannelQuery.value.execute({ id });
			//h(handlerDbNotFound(channelNotFound(id)));
			fastify.log.info(`Channel delete by ${req.user.id}-${req.user.name}`, channel);
			return reply.send(result(null));
		}
	});

	const deleteChannelsQuery = dbm.prepare((db) => db.delete(schema.channels)
		.where(inArray(schema.channels.id, sql.placeholder("ids")))
		.returning({ count: sql<number>`count(*)::int` })
		.prepare("delete_channels_query")
	);
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
			const [{count = -1} = {}] = await deleteChannelsQuery.value.execute({ ids });
			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`Channel batch delete by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});

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
				200: resultSuccessSchema(ChannelModel.channelDetailSchema),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const db = dbm.connection;
			const { name } = req.body;
			const { channelId } = req.params;

			const data = await db.transaction(async (tx) => {
				const [group] = await tx.insert(schema.groups).values({ name })
					.onConflictDoNothing()
					.returning({ id: schema.groups.id });
				assert(group);

				await tx.insert(schema.channelsToGroups).values({
					channelId,
					groupId: group.id
				});

				const channel = await tx.query.channels.findFirst({
					where: eq(schema.channels.id, channelId),
					with: {
						groups: {
							with: { group: true }
						}
					}
				});
				assert(channel);
				return {
					...channel,
					groups: channel?.groups.map(i => i.group)
				};
			});

			fastify.log.info(`Channel group added by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});

	const deleteChannelGroups = dbm.prepare(db => db.delete(schema.channelsToGroups)
		.where(and(
			eq(schema.channelsToGroups.channelId, sql.placeholder("channelId")),
			inArray(schema.channelsToGroups.groupId, sql.placeholder("ids"))
		))
		.returning({ count: sql<number>`count(*)::int` })
		.prepare("delete_channel_groups")
	);
	const deleteAllChannelGroups = dbm.prepare(db => db.delete(schema.channelsToGroups)
		.where(eq(schema.channelsToGroups.channelId, sql.placeholder("channelId")))
		.returning({ count: sql<number>`count(*)::int` })
		.prepare("delete_channel_groups")
	);
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

			const query = ids.length ? deleteChannelGroups : deleteAllChannelGroups;

			const [{count = -1} = {}] = await query.value.execute({ channelId, ids })
			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`Channel groups batch disconnect by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});
});
