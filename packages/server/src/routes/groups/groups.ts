import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import { ResultError, result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import * as GroupModel from "@shared/models/Group";
import { counted } from "@shared/models/Counted";
import { paginationSchema, paginationDefaults, pageinationQuerySchema } from "@shared/models/Pagination";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { inject } from "src/injection";

import groupUsers  from "./groupUsers";
import groupChannels from "./groupChannels";
import { intGt, toInt } from '@shared/helpers/zodHelpers';
import { groupIdParamSchema } from './models';
import { authorizeJWT } from 'src/middleware/authorizeJWT';

const controller = new Hono();

controller.route("/users", groupUsers);
controller.route("/channels", groupChannels);
controller.use("*", authorizeJWT);

controller.get("/", zValidator("query", pageinationQuerySchema), async (c) => {
	const groupsRepository = inject("GroupsRepository");
	const { skip, take } = { ...paginationDefaults, ...c.req.valid("query") };
	const [ data, count ] = await groupsRepository.listGroups({ skip, take });

	return c.json(result({
		data,
		count,
	}));
});

controller.post('/', zValidator("json", GroupModel.groupCreateSchema), async(c) => {
	const groupsRepository = inject("GroupsRepository");
	const { name } = c.req.valid("json");
	const { id } = await groupsRepository.insertGroup(name);
	const group = await groupsRepository.getGroupPreview(id);
	// fastify.log.info(`Group created by ${req.user.id}-${req.user.name}`, group);
	return c.json(result({
		...group,
	}));
});

controller.delete("/", zValidator("query", z.object({ id: batchIdsSchema })), async (c) => {
	const groupsRepository = inject("GroupsRepository");
	const ids = parseIds(c.req.valid("query").id);
	const count = await groupsRepository.deleteGroups(ids);

	const data = {
		count,
		outOf: ids.length,
	};
	// fastify.log.info(`Group batch delete by ${req.user.id}-${req.user.name}`, data);
	return c.json(result(data));
});

controller.get(
	"/search",
	zValidator("query", z.object({
		name: z.string().optional(),
		channel: z.string().refine(...intGt(0)).transform(toInt).optional(),
		user: z.string().refine(...intGt(0)).transform(toInt).optional(),
	})),
	async (c) => {
		const groupsRepository = inject("GroupsRepository");
		const { name, channel, user } = c.req.valid("query");

		const groups = await groupsRepository.searchAvailableGroups({
			name,
			channelId: channel,
			userId: user,
		});

		return c.json(result(groups));
	}
);

controller.get("/:groupId", zValidator("param", groupIdParamSchema), async(c) => {
	const groupsRepository = inject("GroupsRepository");

	const {groupId: id} = c.req.valid("param");
	const group = await groupsRepository.getGroupDetail(id);
	return c.json(result(group));
});

controller.put(
	"/:groupId", 
	zValidator("param", groupIdParamSchema), 
	zValidator("json", GroupModel.groupUpdateSchema),
	async(c) => {
		const groupsRepository = inject("GroupsRepository");
		const {groupId: id} = c.req.valid("param");
		const { name } = c.req.valid("json");
		const group = await groupsRepository.updateGroup(id, name);
		// fastify.log.info(`Group update by ${req.user.id}-${req.user.name}`, group);
		return c.json(result(group));
	}
);


controller.delete(
	"/:groupId", 
	zValidator("param", groupIdParamSchema), 
	async(c) => {
		const groupsRepository = inject("GroupsRepository");
		const {groupId: id} = c.req.valid("param");
		const count = await groupsRepository.deleteGroups([ id ]);
		if (!count) {
			throw new ResultError(404, `Group with id "${id}" not foind`);
		}
		//fastify.log.info(`Group delete by ${req.user.id}-${req.user.name}`, id);
		return c.json(result(null));
	}
);

export default controller;
