import z from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import * as GroupModel from "@shared/models/Group";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { inject } from "src/injection";

export function groupUsers<Instace extends FastifyInstance>(fastify: Instace) {
	const groupsRepository = inject("GroupsRepository");
	const usersToGroupRelationRepository = inject("UsersToGroupRelationRepository");

	const baseGroupUsersUrl = "/groups/:groupId/users";
	const baseGroupUsersParams = z.object({
		groupId: z.number({ coerce: true }).int().gt(0),
	});

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
			const { groupId } = req.params;
			const { name } = req.body;

			await usersToGroupRelationRepository.connectGroupUser(groupId, name);
			const group = await groupsRepository.getGroupDetail(groupId);

			fastify.log.info(`Groups updated by ${req.user.id}-${req.user.name}`, group);
			return reply.send(result(group));
		}
	});

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
			const groupId = req.params.groupId;
			const ids = req.query.id !== undefined ? parseIds(req.query.id) : undefined;

			const count = await usersToGroupRelationRepository.deleteGroupUsers(groupId, ids);

			const data = {
				count,
				outOf: ids?.length ?? -1,
			};
			fastify.log.info(`Groups users batch disconnect by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});
}