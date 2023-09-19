import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import * as GroupModel from "@shared/models/Group";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { removeRestricredChannels } from "src/services/UserChannels";
import { inject } from "src/injection";
import { schema } from "src/db";
import { assert } from "src/util/assert";
import { and, eq, sql } from "drizzle-orm";

export function userGroups<Instace extends FastifyInstance>(fastify: Instace) {
	const dbm = inject("db");
	// const userNotFound = (id: string | number) => `user with id '${id}' doesn't exist`;
	const baseUserGroupsUrl = "/users/:userId/groups";
	const baseUserGroupsParams = z.object({
		userId: z.number({ coerce: true }).int().gt(0),
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: baseUserGroupsUrl,
		schema: {
			params: baseUserGroupsParams,
			body: z.object({ name: GroupModel.groupNameSchema }),
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema,
				409: resultFailureSchema,
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const db = dbm.connection;
			const id = req.params.userId;
			const name = req.body.name;

			await db.transaction(async (tx) => {
				const [group] = await tx.insert(schema.groups).values({ name })
					.returning()
					.onConflictDoNothing();
				assert(group);
				await tx.insert(schema.usersToGroups).values({
					userId: id,
					groupId: group?.id
				});
			});
			// .catch(handlerDbNotFound(userNotFound(id)))
			fastify.log.info(`Group added to user ${req.params.userId} edit by ${req.user.id}-${req.user.name}`, req.body);
			return reply.send(result(null));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: `${baseUserGroupsUrl}/:groupId`,
		schema: {
			params: baseUserGroupsParams.extend({
				groupId: z.number({ coerce: true }).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema,
				409: resultFailureSchema,
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const db = dbm.connection;
			const { userId, groupId } = req.params;
			await db.transaction(async (tx) => {
				const count = await tx.delete(schema.usersToGroups)
					.where(and(
						eq(schema.usersToGroups.userId, userId),
						eq(schema.usersToGroups.groupId, groupId),
					))
					.returning({ count: sql<number>`count(*)`});
				await removeRestricredChannels(tx);
				return count;
			})
			//.catch(handlerDbNotFound("Failed to delete the group"));
			return reply.send(result(null));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: baseUserGroupsUrl,
		schema: {
			params: baseUserGroupsParams,
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema,
				409: resultFailureSchema,
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const db = dbm.connection;
			const { userId } = req.params;
			await db.transaction(async (tx) => {
				await tx.delete(schema.usersToGroups).where(eq(schema.usersToGroups.userId, userId));
				// If we removed all of the users groups, than he has no permissions for any channels
				await tx.delete(schema.usersToChannels).where(eq(schema.usersToChannels.userId, userId));
			});
			// .catch(handlerDbNotFound(userNotFound(userId)))
			return reply.send(result(null));
		}
	});
}