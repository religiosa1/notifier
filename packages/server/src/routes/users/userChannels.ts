import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';
import { paramErrorHook, validationErrorHook } from 'src/middleware/validationErrorHandlers';

import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import type { Counted } from "@shared/models/Counted";
import type { ContextVariables } from 'src/ContextVariables';
import type * as ChannelModel from '@shared/models/Channel';
import { batchIdsSchema, parseIds } from "@shared/models/batchIds";
import { pageinationQuerySchema, paginationDefaults } from "@shared/models/Pagination";
import { di } from "src/injection";

import { userIdParamsSchema } from './models';

const controller = new Hono<{ Variables: ContextVariables}>();

controller.get(
	"/",
	zValidator("param", userIdParamsSchema, paramErrorHook),
	zValidator("query", pageinationQuerySchema, validationErrorHook),
	async (c) => {
		const userToChannelRelationsRepository = di.inject("UserToChannelRelationsRepository");
		const { userId } = c.req.valid("param");
		const { skip, take } = { ...paginationDefaults, ...c.req.valid("query") };
		const [data, count] = await userToChannelRelationsRepository.listUserChannels(userId, { skip, take });
		return c.json({ data, count } satisfies Counted<ChannelModel.Channel[]>);
	}
);

controller.get(
	"/available-channels",
	zValidator("param", userIdParamsSchema, paramErrorHook),
	zValidator("query", pageinationQuerySchema, validationErrorHook),
	async (c) => {
		const userToChannelRelationsRepository = di.inject("UserToChannelRelationsRepository");
		const { userId } = c.req.valid("param");
		const { skip, take } = { ...paginationDefaults, ...c.req.valid("query") };
		const data = await userToChannelRelationsRepository.listAvailableUnsubscribedChannelsForUser(userId, { skip, take });
		return c.json(data satisfies ChannelModel.Channel[]);
	}
);

controller.post(
	"/",
	zValidator("param", userIdParamsSchema, paramErrorHook),
	zValidator("json", z.object({ id: z.number({ coerce: true }).int().gt(0) }), validationErrorHook),
	async (c) => {
		const logger = di.inject("logger");
		const userToChannelRelationsRepository = di.inject("UserToChannelRelationsRepository");
		const { userId } = c.req.valid("param");
		const { id: channelId } = c.req.valid("json");
		await userToChannelRelationsRepository.connectUserChannel(userId, channelId);
		logger.info(`Channel added to user ${userId} edit by ${c.get("user").id}-${c.get("user").id}`, channelId);
		return c.json(null);
	}
);

controller.delete(
	"/",
	zValidator("param", userIdParamsSchema, paramErrorHook),
	zValidator("query",  z.object({ id: batchIdsSchema }), validationErrorHook),
	async (c) => {
		const userToChannelRelationsRepository = di.inject("UserToChannelRelationsRepository");
		const { userId } = c.req.valid("param");
		const ids = parseIds(c.req.valid("query").id);

		const count = await userToChannelRelationsRepository.disconnectUserChannels(userId, ids)
			// .catch(handlerDbNotFound(userNotFound(userId)))

		const data = {
			count,
			outOf: ids.length,
		};
		return c.json(data satisfies BatchOperationStats);
	}
)

export default controller;
