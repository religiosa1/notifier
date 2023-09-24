import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import * as GroupModel from "@shared/models/Group";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { inject } from "src/injection";

export function userGroups<Instace extends FastifyInstance>(fastify: Instace) {
	const userToGroupRelationsRepository = inject("UserToGroupRelationsRepository");

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
			await userToGroupRelationsRepository.connectGroupToUser(id, name);
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
			const { userId, groupId } = req.params;
			await userToGroupRelationsRepository.deleteGroupFromUser(userId, groupId);
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
			const { userId } = req.params;
			await userToGroupRelationsRepository.deleteAllGroupsFromUser(userId);
			return reply.send(result(null));
		}
	});
}