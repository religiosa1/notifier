import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import type { ContextVariables } from 'src/ContextVariables';
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { channelNameSchema } from "@shared/models/Channel";
import { di } from "src/injection";

import { groupIdParamSchema } from './models';

const controller = new Hono<{ Variables: ContextVariables }>();

controller.post(
	"/", 
	zValidator("param", groupIdParamSchema), 
	zValidator("json", z.object({ name: channelNameSchema })),
	async (c) => {
		const logger = di.inject("logger");
		const channelToGroupRelationsRepository = di.inject("ChannelToGroupRelationsRepository");
		const { groupId } = c.req.valid("param");
		const { name } = c.req.valid("json");

		await channelToGroupRelationsRepository.connectOrCreateChannelToGroup(groupId, name);

		logger.info(`Group channel connected by ${c.get("user").id}-${c.get("user").name}`, groupId, name);
		return c.json(null);
	}
);

controller.delete(
	"/",
	zValidator("param", groupIdParamSchema),
	zValidator("query", z.object({ id: z.optional(batchIdsSchema) })),
	async (c) => {
		const logger = di.inject("logger");
		const channelToGroupRelationsRepository = di.inject("ChannelToGroupRelationsRepository");
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
		logger.info(`Group channels batch disconnect by ${c.get("user").id}-${c.get("user").name}`, data);
		return c.json(data satisfies BatchOperationStats);
	}
);

export default controller;
