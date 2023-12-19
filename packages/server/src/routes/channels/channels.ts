import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import { result } from "@shared/models/Result";
import * as ChannelModel from "@shared/models/Channel";
import { counted } from "@shared/models/Counted";
import { paginationDefaults, pageinationQuerySchema } from "@shared/models/Pagination";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { inject } from "src/injection";
import channelGroups from "./channelGroups";
import { channelIdRoute } from './models';
import { authorizeJWT } from 'src/middleware/authorizeJWT';
import type { ContextVariables } from 'src/ContextVariables';

const controller = new Hono<{ Variables: ContextVariables }>();
controller.use("*", authorizeJWT);
controller.route("/:channelId/groups", channelGroups);

/**
 * 				200: resultSuccessSchema(counted(z.array(ChannelModel.channelSchema.extend({
					usersCount: z.number(),
					groupsCount: z.number(),
				})))),
 */
controller.get('/', zValidator("query", pageinationQuerySchema), async (c) => {
	const channelsRepository = inject("ChannelsRepository");
	const query = c.req.valid("query");
	const { skip, take } = { ...paginationDefaults, ...query };
	const [ data, count ] = await channelsRepository.listChannels({ skip , take });

	return c.json(result({
		data,
		count,
	}));
});

/** 200: resultSuccessSchema(z.array(ChannelModel.channelSchema)), */
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

	return c.json(result(channels));
});

/** 
200: resultSuccessSchema(ChannelModel.channelSchema),
409: resultFailureSchema,
*/
controller.post("/", zValidator("json",  ChannelModel.channelCreateSchema), async (c) => {
	const logger = inject("logger");
	const channelsRepository = inject("ChannelsRepository");
	const body = c.req.valid("json");
	const channel = await channelsRepository.insertChannel(body.name);
	logger.info(`Channel created by ${c.get("user").id}-${c.get("user").name}`, channel);
	return c.json(result(channel));
});

/* params: z.object({
				channelId: z.number({ coerce: true }).int().gt(0),
			}),*/
controller.get("/:channelId", zValidator("param", channelIdRoute), async (c) => {
	const channelsRepository = inject("ChannelsRepository");
	const {channelId} = c.req.valid("param");
	const channel = await channelsRepository.getChannelDetail(channelId);
	return c.json(result(channel));
});

/**200: resultSuccessSchema(ChannelModel.channelSchema),
				404: resultFailureSchema,
				409: resultFailureSchema, */
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
		return c.json(result(channel));
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
		return c.json(result(null));
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
	return c.json(result(data));
});

export default controller;