import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "src/db";
import * as GroupModel from "src/models/Group";
import type { FastifyInstance } from "fastify";
import { result, resultFailureSchema, resultSuccessSchema } from "src/models/Result";
import { handlerDbNotFound } from "src/error/handlerRecordNotFound";

export function userGroups<Instace extends FastifyInstance>(fastify: Instace) {
  const userNotFound = (id: string | number) => `user with id '${id}' doesn't exist`;
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
			const id = req.params.userId;
			const name = req.body.name;
			await db.user.update({
				where: { id },
				data: {
					groups: {
						connectOrCreate: [{
							where: { name },
							create: { name },
						}]
					}
				}
			}).catch(handlerDbNotFound(userNotFound(id)))
			fastify.log.info(`Group added to user ${req.params.userId} edit by ${req.user.id}-${req.user.name}`, req.body);
			return reply.send(result(null));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: `${baseUserGroupsUrl}/:groupId`,
		schema: {
			params: baseUserGroupsParams.extend({
				groupId: z.number({ coerce: true}).int().gt(0),
			}),
			response: {
				200: resultSuccessSchema(z.null()),
				404: resultFailureSchema,
				409: resultFailureSchema,
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { userId, groupId } = req.params;
			await db.$transaction([
				// if we disconnect a group from a user, then we need to check that he has access to the channels
				db.userChannel.deleteMany({
					where: {
						userId,
						channel: { Groups: { none: { id: groupId } }}
					}
				}),
				db.user.update({
					where: { id: userId },
					data: {
						groups: {
							disconnect: { id: groupId }
						}
					}
				})
			]).catch(handlerDbNotFound("Failed to delete the group"));
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
			const {userId} = req.params;
			await db.$transaction([
				db.user.update({
					where: { id: userId },
					data: { groups: { set: [] } },
				}),
				// If we removed all of the users groups, than he has no permissions for any channels
				db.userChannel.deleteMany({ where: {userId} }),
			]).catch(handlerDbNotFound(userNotFound(userId)))
			return reply.send(result(null));
		}
	});
}