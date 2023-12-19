import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { inject } from "src/injection";
import { groupNameSchema } from "@shared/models/Group";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { batchIdsSchema, parseIds } from "@shared/models/batchIds";
import { channelIdRoute } from './models';


const controller = new Hono();

controller.post(
	"/", 
	zValidator("param", channelIdRoute),
	zValidator("json", z.object({ name: groupNameSchema })),
	async (c) => {
		const channelToGroupRelationsRepository = inject("ChannelToGroupRelationsRepository");
		const { name } = c.req.valid("json");
		const { channelId } = c.req.valid("param");
		await channelToGroupRelationsRepository.connectOrCreateGroupToChannel(channelId, name);
		// fastify.log.info(`Channel group added by ${req.user.id}-${req.user.name}`, channelId, name);
		return c.json(result(null));
	}
);

controller.delete(
	"/",
	zValidator("param", channelIdRoute),
	zValidator("query", z.object({ id: z.optional(batchIdsSchema) })),
	async (c) => {
		const channelsRepository = inject("ChannelsRepository");
		const channelToGroupRelationsRepository = inject("ChannelToGroupRelationsRepository");

		const { channelId } = c.req.valid("param");
		const ids = parseIds(c.req.valid("query")?.id || "");

		await channelsRepository.assertChannelExist(channelId);

		const count = ids.length
			? await channelToGroupRelationsRepository.disconnectGroupsFromChannelByIds(channelId, ids)
			: await channelToGroupRelationsRepository.disconnectAllGroupsFromChannel(channelId)

		const data = {
			count,
			outOf: ids.length,
		};
		// fastify.log.info(`Channel groups batch disconnect by ${req.user.id}-${req.user.name}`, data);
		return c.json(result(data));
	}
)

export default controller;