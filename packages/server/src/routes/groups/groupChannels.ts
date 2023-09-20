import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import * as GroupModel from "@shared/models/Group";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import type { FastifyInstance } from "fastify";
import { channelNameSchema } from "@shared/models/Channel";
import { removeRestricredChannels } from "src/services/UserChannels";
import { inject } from "src/injection";
import { schema } from "src/db";
import { assert } from "src/util/assert";
import { and, eq, inArray, sql } from "drizzle-orm";

export function groupChannels<Instace extends FastifyInstance>(fastify: Instace) {
	const dbm = inject("db");

	const groupNotFound = (id: string | number) => `group with id '${id}' doesn't exist`;

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/groups/:groupId/channels",
		schema: {
			params: z.object({
				groupId: z.number({ coerce: true }).int().gt(0),
			}),
			body: z.object({
				name: channelNameSchema,
			}),
			response: {
				200: resultSuccessSchema(GroupModel.groupDetailSchema),
				404: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const db = dbm.connection;
			const { groupId } = req.params;
			const { name } = req.body;

			const group = await db.transaction(async (tx) => {
				const [ channel ] = await tx.insert(schema.channels)
					.values({ name }).onConflictDoNothing()
					.returning({ id: schema.channels.id});
				assert(channel);

				await tx.insert(schema.channelsToGroups).values({
					groupId,
					channelId: channel.id
				}).onConflictDoNothing();

				const group = await tx.query.groups.findFirst({
					where: eq(schema.groups.id, groupId),
					with: {
						users: { with: {
								user: {
									columns: {
										id: true,
										name: true,
									}
								},
						}},
						channels: { with: {
								channel: true
						}},
					}
				});
				assert(group);
				return {
					...group,
					users: group.users.map(i => i.user),
					channels: group.channels.map(i => i.channel),
				};
			});

			// .catch(handlerDbNotFound(groupNotFound(groupId)));
			fastify.log.info(`Group channels updated by ${req.user.id}-${req.user.name}`, group);
			return reply.send(result(group));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/groups/:groupId/channels",
		schema: {
			querystring: z.object({ id: z.optional(batchIdsSchema) }),
			params: z.object({
				groupId: z.number({ coerce: true }).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
				404: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const db = dbm.connection;
			const { groupId } = req.params;
			const ids = parseIds(req.query.id || "");

			const count = await db.transaction(async (tx) => {
				const [{ count = -1} = {}] = await tx.delete(schema.channelsToGroups).where(
					ids.length
						? and(
							eq(schema.channelsToGroups.groupId, groupId),
							inArray(schema.channelsToGroups.channelId, ids),
						) : eq(
							schema.channelsToGroups.groupId, groupId
						),
				)
				.returning({ count: sql<number>`count(*)::int` })
				await removeRestricredChannels(tx);
				return count;
			})
			// .catch(handlerDbNotFound(groupNotFound(groupId)));
			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`Group channels batch disconnect by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});
}