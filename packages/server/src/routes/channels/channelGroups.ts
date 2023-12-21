import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import type { ContextVariables } from 'src/ContextVariables';
import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import { di } from "src/injection";

import { groupNameSchema } from "@shared/models/Group";
import { batchIdsSchema, parseIds } from "@shared/models/batchIds";
import { channelIdRoute } from './models';


const controller = new Hono<{ Variables: ContextVariables }>();

controller.post(
	"/", 
	zValidator("param", channelIdRoute),
	zValidator("json", z.object({ name: groupNameSchema })),
	async (c) => {
		const logger = di.inject("logger");
		const channelToGroupRelationsRepository = di.inject("ChannelToGroupRelationsRepository");
		const { name } = c.req.valid("json");
		const { channelId } = c.req.valid("param");
		await channelToGroupRelationsRepository.connectOrCreateGroupToChannel(channelId, name);
		logger.info(`Channel group added by ${c.get("user").id}-${c.get("user").name}`, channelId, name);
		return c.json(null);
	}
);

controller.delete(
	"/",
	zValidator("param", channelIdRoute),
	zValidator("query", z.object({ id: z.optional(batchIdsSchema) })),
	async (c) => {
		const logger = di.inject("logger");
		const channelsRepository = di.inject("ChannelsRepository");
		const channelToGroupRelationsRepository = di.inject("ChannelToGroupRelationsRepository");

		const { channelId } = c.req.valid("param");
		const ids = parseIds(c.req.valid("query")?.id || "");

		await channelsRepository.assertChannelExist(channelId);

		const count = ids.length
			? await channelToGroupRelationsRepository.disconnectGroupsFromChannelByIds(channelId, ids)
			: await channelToGroupRelationsRepository.disconnectAllGroupsFromChannel(channelId)

		const data: BatchOperationStats = {
			count,
			outOf: ids.length,
		};
		logger.info(`Channel groups batch disconnect by ${c.get("user").id}-${c.get("user").name}`, data);
		return c.json(data);
	}
)

export default controller;