import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import type { FastifyInstance } from "fastify";
import { channelNameSchema } from "@shared/models/Channel";
import { inject } from "src/injection";
import { groupIdParamSchema } from './models';

const controller = new Hono();

controller.post(
	"/", 
	zValidator("param", groupIdParamSchema), 
	zValidator("json", z.object({ name: channelNameSchema })),
	async (c) => {
		const channelToGroupRelationsRepository = inject("ChannelToGroupRelationsRepository");
		const { groupId } = c.req.valid("param");
		const { name } = c.req.valid("json");

		await channelToGroupRelationsRepository.connectOrCreateChannelToGroup(groupId, name);

		// fastify.log.info(`Group channel connected by ${req.user.id}-${req.user.name}`, groupId, name);
		return c.json(result(null));
	}
);

controller.delete(
	"/",
	zValidator("param", groupIdParamSchema),
	zValidator("query", z.object({ id: z.optional(batchIdsSchema) })),
	async (c) => {
		const channelToGroupRelationsRepository = inject("ChannelToGroupRelationsRepository");
		const { groupId } = c.req.valid("param");
		const ids = parseIds(c.req.valid("query").id || "");
		// orphaned user-to-channel relations handled by a db trigger
		const count = ids?.length
			? await channelToGroupRelationsRepository.deleteChannelsFromGroupByIds(groupId, ids)
			: await channelToGroupRelationsRepository.deleteAllChannelsFromGroup(groupId);
		const data = {
			count,
			outOf: ids.length,
		};
		// fastify.log.info(`Group channels batch disconnect by ${req.user.id}-${req.user.name}`, data);
		return c.json(result(data));
	}
);

export default controller;
