import z from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import * as GroupModel from "@shared/models/Group";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
// import { handlerDbNotFound } from "src/error/handlerRecordNotFound";
import { removeRestricredChannels } from "src/services/UserChannels";
import { inject } from "src/injection";
import { schema } from "src/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { assert } from "src/util/assert";

export function groupUsers<Instace extends FastifyInstance>(fastify: Instace) {
	const dbm = inject("db");

	// const groupNotFound = (id: string | number) => `group with id '${id}' doesn't exist`;
	const baseGroupUsersUrl = "/groups/:groupId/users";
	const baseGroupUsersParams = z.object({
		groupId: z.number({ coerce: true }).int().gt(0),
	});

	// FIXME: DUPLICATION WITH group.ts
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
		method: "POST",
		url: baseGroupUsersUrl,
		schema: {
			params: baseGroupUsersParams,
			body: z.object({
				name: z.string().min(1),
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
			await db.transaction(async (tx) => {
				const user = await tx.query.users.findFirst({
					where: eq(schema.users.name, name)
				});
				assert(user);
				tx.insert(schema.usersToGroups).values({
					groupId,
					userId: user.id
				});
			});
			const group = await getGroupDetailQuery.value.execute({ id: groupId });
			assert(group);
			// .catch(handlerDbNotFound(groupNotFound(groupId)));
			fastify.log.info(`Groups updated by ${req.user.id}-${req.user.name}`, group);
			return reply.send(result({
				...group,
				users: group.users.map(i => i.user),
				channels: group.channels.map(i => i.channel),
			}));
		}
	});

	const deleteGroupsUsersQuery = dbm.prepare((db) => db.delete(schema.usersToGroups)
		.where(and(
			eq(schema.usersToGroups.groupId, sql.placeholder("groupId")),
			inArray(schema.usersToGroups.userId, sql.placeholder("ids")),
		))
		.returning({ count: sql<number>`count(*)` })
	);
	const deleteAllGroupsUsersQuery = dbm.prepare((db) => db.delete(schema.usersToGroups)
		.where(eq(schema.usersToGroups.groupId, sql.placeholder("groupId")))
		.returning({ count: sql<number>`count(*)` })
	);
	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: baseGroupUsersUrl,
		schema: {
			querystring: z.object({ id: z.optional(batchIdsSchema) }),
			params: baseGroupUsersParams,
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
				404: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const db = dbm.connection;

			const groupId = req.params.groupId;
			const ids = parseIds(req.query.id || "");

			const count = await db.transaction(async (tx) => {
				const query = ids.length ? deleteGroupsUsersQuery : deleteAllGroupsUsersQuery;
				const [{ count = -1} = {}] = await query.value.execute({ groupId, ids });
				await removeRestricredChannels(tx);
				return count;
			})
			//.catch(handlerDbNotFound(groupNotFound(groupId)));

			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`Groups users batch disconnect by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});
}