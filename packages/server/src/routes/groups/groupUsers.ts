import z from "zod";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import * as GroupModel from "@shared/models/Group";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { db } from "src/db";
import { handlerDbNotFound } from "src/error/handlerRecordNotFound";
import { removeRestricredChannels } from "src/services/UserChannels";

export function groupUsers<Instace extends FastifyInstance>(fastify: Instace) {
	const groupNotFound = (id: string | number) => `group with id '${id}' doesn't exist`;
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
			const name = req.body.name;
			const data = await db.group.update({
				where: { id: groupId },
				include: {
					Users: true,
					Channels: true,
				},
				data: {
					Users: { connect: { name } },
				},
			}).catch(handlerDbNotFound(groupNotFound(groupId)));
			fastify.log.info(`Groups updated by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
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
			const ids = parseIds(req.query.id || "");

			const response = await db.$transaction(async (tx) => {
				const resp = await tx.group.update({
					where: { id: groupId },
					include: {
						Users: { select: { id: true },
						where: ids.length
							? { id: { in: ids} }
							: undefined
					}},
					data: {
						Users: ids.length
							? { disconnect: ids.map(id => ({ id })) }
							: { set: [] }
					}
				});
				await removeRestricredChannels(tx);
				return resp
			}).catch(handlerDbNotFound(groupNotFound(groupId)));

			const data = {
				count: response.Users.length,
				outOf: ids.length,
			};
			fastify.log.info(`Groups users batch disconnect by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});
}