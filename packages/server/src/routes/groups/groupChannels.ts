import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "src/models/Result";
import { db } from "src/db";
import * as GroupModel from "src/models/Group";
import { batchOperationStatsSchema } from "src/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "src/models/batchIds";
import { handlerDbNotFound } from "src/error/handlerRecordNotFound";
import type { FastifyInstance } from "fastify";
import { channelNameSchema } from "src/models/Channel";
import { removeRestricredChannels } from "src/services/UserChannels";

export function groupChannels<Instace extends FastifyInstance>(fastify: Instace) {
	const groupNotFound = (id: string | number) => `group with id '${id}' doesn't exist`;
	const baseGroupChannelsUrl = "/groups/:groupId/channels";
	const baseGroupChannelsParams = z.object({
		groupId: z.number({ coerce: true }).int().gt(0),
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: baseGroupChannelsUrl,
		schema: {
			params: baseGroupChannelsParams,
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
			const { groupId } = req.params;
			const { name } = req.body;
			const data = await db.group.update({
				where: { id: groupId },
				include: {
					Users: true,
					Channels: true,
				},
				data: {
					Channels: { connectOrCreate: {
						create: { name },
						where: { name },
					}}
				},
			}).catch(handlerDbNotFound(groupNotFound(groupId)));
			fastify.log.info(`Group channels updated by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: baseGroupChannelsUrl,
		schema: {
			querystring: z.object({ id: z.optional(batchIdsSchema) }),
			params: baseGroupChannelsParams,
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
				const groups = await tx.group.update({
					where: { id: groupId },
					include: {
						Channels: { select: { id: true },
						where: ids.length
							? { id: { in: ids} }
							: undefined
					}},
					data: {
						Channels: ids.length
							? { disconnect: ids.map(id => ({ id })) }
							: { set: [] }
					}
				});
				await removeRestricredChannels(tx);
				return groups;
			}).catch(handlerDbNotFound(groupNotFound(groupId)));
			const data = {
				count: response.Channels.length,
				outOf: ids.length,
			};
			fastify.log.info(`Group channels batch disconnect by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});
}