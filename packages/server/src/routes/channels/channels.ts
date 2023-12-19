import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import * as ChannelModel from "@shared/models/Channel";
import type { Counted } from '@shared/models/Counted';
import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import { paginationDefaults, pageinationQuerySchema } from "@shared/models/Pagination";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { inject } from "src/injection";
import channelGroups from "./channelGroups";
import { channelIdRoute } from './models';
import { authorizeJWT } from 'src/middleware/authorizeJWT';
import type { ContextVariables } from 'src/ContextVariables';

const controller = new Hono<{ Variables: ContextVariables }>();
controller.use("*", authorizeJWT);
controller.route("/:channelId/groups", channelGroups);

controller.get('/', zValidator("query", pageinationQuerySchema), async (c) => {
	const channelsRepository = inject("ChannelsRepository");
	const query = c.req.valid("query");
	const { skip, take } = { ...paginationDefaults, ...query };
	const [ data, count ] = await channelsRepository.listChannels({ skip , take });

	return c.json({
		data,
		count,
	} satisfies Counted<Array<ChannelModel.Channel & { usersCount: number; groupsCount: number}>>);
});

controller.get('/search', zValidator("query", z.object({
	name: z.string().optional(),
	group: z.string()
		.refine(
			value => {
				const parsedValue = parseInt(value, 10);
				return !isNaN(parsedValue) && parsedValue > 0;
			}, 
			{ message: "Must be an integer greater than 0" }
		).optional()
		.transform((val) => parseInt(val ?? '', 10) || undefined)
})), async(c) => {
	const channelsRepository = inject("ChannelsRepository");
	const { group, name = "" } =  c.req.valid("query");

	const channels = group
		? await channelsRepository.searchChannelsForGroup({ name, groupId: group })
		: await channelsRepository.searchChannels({ name });

	return c.json(channels satisfies ChannelModel.Channel[]);
});

controller.post("/", zValidator("json",  ChannelModel.channelCreateSchema), async (c) => {
	const logger = inject("logger");
	const channelsRepository = inject("ChannelsRepository");
	const body = c.req.valid("json");
	const channel = await channelsRepository.insertChannel(body.name);
	logger.info(`Channel created by ${c.get("user").id}-${c.get("user").name}`, channel);
	return c.json(channel satisfies ChannelModel.Channel);
});

controller.get("/:channelId", zValidator("param", channelIdRoute), async (c) => {
	const channelsRepository = inject("ChannelsRepository");
	const {channelId} = c.req.valid("param");
	const channel = await channelsRepository.getChannelDetail(channelId);
	return c.json(channel satisfies ChannelModel.ChannelDetail);
});

controller.put(
	"/:channelId", 
	zValidator("param", channelIdRoute), 
	zValidator("json", ChannelModel.channelUpdateSchema),
	async (c) => {
		const logger = inject("logger");
		const channelsRepository = inject("ChannelsRepository");
		const { channelId: id } = c.req.valid("param");
		const { name } = c.req.valid("json");

		const channel = await channelsRepository.updateChannel(id, name);

		logger.info(`Channel update by ${c.get("user").id}-${c.get("user").name}`, channel);
		return c.json(channel satisfies ChannelModel.Channel);
	}
);

controller.delete(
	"/:channelId", 
	zValidator("param", channelIdRoute), 
	async (c) => {
		const logger = inject("logger");
		const channelsRepository = inject("ChannelsRepository");
		const { channelId: id } = c.req.valid("param");
		await channelsRepository.assertChannelExist(id);
		await channelsRepository.deleteChannels([id]);
		logger.info(`Channel delete by ${c.get("user").id}-${c.get("user").name}`, id);
		return c.json(null);
	}
);

controller.delete("/", zValidator("query", z.object({ id: batchIdsSchema })), async(c) => {
	const logger = inject("logger");
	const channelsRepository = inject("ChannelsRepository");
	const query = c.req.valid("query");
	const ids = parseIds(query.id);
	const count = await channelsRepository.deleteChannels(ids);
	const data = {
		count,
		outOf: ids.length,
	};
	logger.info(`Channel batch delete by ${c.get("user").id}-${c.get("user").name}`, data);
	return c.json(data satisfies BatchOperationStats);
});

export default controller;