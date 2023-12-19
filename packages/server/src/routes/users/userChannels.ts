import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import { result } from "@shared/models/Result";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { batchIdsSchema, parseIds } from "@shared/models/batchIds";
import { pageinationQuerySchema, paginationDefaults } from "@shared/models/Pagination";
import { counted } from "@shared/models/Counted";
import { inject } from "src/injection";
import { userIdParamsSchema } from './models';
import { ContextVariables } from 'src/ContextVariables';

const controller = new Hono<{ Variables: ContextVariables}>();

controller.get(
	"/",
	zValidator("param", userIdParamsSchema),
	zValidator("query", pageinationQuerySchema),
	async (c) => {
		const userToChannelRelationsRepository = inject("UserToChannelRelationsRepository");
		const { userId } = c.req.valid("param");
		const { skip, take } = { ...paginationDefaults, ...c.req.valid("query") };
		const [data, count] = await userToChannelRelationsRepository.listUserChannels(userId, { skip, take });
		return c.json(result({ data, count  }));
	}
);

controller.get(
	"/available-channels",
	zValidator("param", userIdParamsSchema),
	zValidator("query", pageinationQuerySchema),
	async (c) => {
		const userToChannelRelationsRepository = inject("UserToChannelRelationsRepository");
		const { userId } = c.req.valid("param");
		const { skip, take } = { ...paginationDefaults, ...c.req.valid("query") };
		const data = await userToChannelRelationsRepository.listAvailableUnsubscribedChannelsForUser(userId, { skip, take });
		return c.json(result(data));
	}
);

controller.post(
	"/",
	zValidator("param", userIdParamsSchema),
	zValidator("json", z.object({ id: z.number({ coerce: true }).int().gt(0) })),
	async (c) => {
		const logger = inject("logger");
		const userToChannelRelationsRepository = inject("UserToChannelRelationsRepository");
		const { userId } = c.req.valid("param");
		const { id: channelId } = c.req.valid("json");
		await userToChannelRelationsRepository.connectUserChannel(userId, channelId);
		logger.info(`Channel added to user ${userId} edit by ${c.get("user").id}-${c.get("user").id}`, channelId);
		return c.json(result(null));
	}
);

controller.delete(
	"/",
	zValidator("param", userIdParamsSchema),
	zValidator("query",  z.object({ id: batchIdsSchema })),
	async (c) => {
		const userToChannelRelationsRepository = inject("UserToChannelRelationsRepository");
		const { userId } = c.req.valid("param");
		const ids = parseIds(c.req.valid("query").id);

		const count = await userToChannelRelationsRepository.disconnectUserChannels(userId, ids)
			// .catch(handlerDbNotFound(userNotFound(userId)))

		const data = {
			count,
			outOf: ids.length,
		};
		return c.json(result(data));
	}
)

export default controller;
