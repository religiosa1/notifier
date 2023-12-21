import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import type { ContextVariables } from 'src/ContextVariables';
import type { Counted } from '@shared/models/Counted';
import { ResultError } from "@shared/models/Result";
import * as GroupModel from "@shared/models/Group";
import { paginationDefaults, pageinationQuerySchema } from "@shared/models/Pagination";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { di } from "src/injection";


import groupUsers  from "./groupUsers";
import groupChannels from "./groupChannels";
import { intGt, toInt } from '@shared/helpers/zodHelpers';
import { groupIdParamSchema } from './models';
import { authorizeJWT } from 'src/middleware/authorizeJWT';

const controller = new Hono<{ Variables: ContextVariables }>();

controller.route("/users", groupUsers);
controller.route("/channels", groupChannels);
controller.use("*", authorizeJWT);

controller.get("/", zValidator("query", pageinationQuerySchema), async (c) => {
	const groupsRepository = di.inject("GroupsRepository");
	const { skip, take } = { ...paginationDefaults, ...c.req.valid("query") };
	const [ data, count ] = await groupsRepository.listGroups({ skip, take });

	return c.json({
		data,
		count,
	} satisfies Counted<GroupModel.Group[]>);
});

controller.post('/', zValidator("json", GroupModel.groupCreateSchema), async(c) => {
	const logger = di.inject("logger");
	const groupsRepository = di.inject("GroupsRepository");
	const { name } = c.req.valid("json");
	const { id } = await groupsRepository.insertGroup(name);
	const group = await groupsRepository.getGroupPreview(id);
	logger.info(`Group created by ${c.get("user").id}-${c.get("user").name}`, group);
	return c.json(group satisfies GroupModel.Group);
});

controller.delete("/", zValidator("query", z.object({ id: batchIdsSchema })), async (c) => {
	const logger = di.inject("logger");
	const groupsRepository = di.inject("GroupsRepository");
	const ids = parseIds(c.req.valid("query").id);
	const count = await groupsRepository.deleteGroups(ids);

	const data = {
		count,
		outOf: ids.length,
	};
	logger.info(`Group batch delete by ${c.get("user").id}-${c.get("user").name}`, data);
	return c.json(data satisfies BatchOperationStats);
});

controller.get(
	"/search",
	zValidator("query", z.object({
		name: z.string().optional(),
		channel: z.string().refine(...intGt(0)).transform(toInt).optional(),
		user: z.string().refine(...intGt(0)).transform(toInt).optional(),
	})),
	async (c) => {
		const groupsRepository = di.inject("GroupsRepository");
		const { name, channel, user } = c.req.valid("query");

		const groups = await groupsRepository.searchAvailableGroups({
			name,
			channelId: channel,
			userId: user,
		});

		return c.json(groups satisfies GroupModel.Group[]);
	}
);

controller.get("/:groupId", zValidator("param", groupIdParamSchema), async(c) => {
	const groupsRepository = di.inject("GroupsRepository");

	const {groupId: id} = c.req.valid("param");
	const group = await groupsRepository.getGroupDetail(id);
	return c.json(group satisfies GroupModel.GroupDetail);
});

controller.put(
	"/:groupId", 
	zValidator("param", groupIdParamSchema), 
	zValidator("json", GroupModel.groupUpdateSchema),
	async(c) => {
		const logger = di.inject("logger");
		const groupsRepository = di.inject("GroupsRepository");
		const {groupId: id} = c.req.valid("param");
		const { name } = c.req.valid("json");
		const group = await groupsRepository.updateGroup(id, name);
		logger.info(`Group update by ${c.get("user").id}-${c.get("user").name}`, group);
		return c.json(group satisfies GroupModel.Group);
	}
);


controller.delete(
	"/:groupId", 
	zValidator("param", groupIdParamSchema), 
	async(c) => {
		const logger = di.inject("logger");
		const groupsRepository = di.inject("GroupsRepository");
		const {groupId: id} = c.req.valid("param");
		const count = await groupsRepository.deleteGroups([ id ]);
		if (!count) {
			throw new ResultError(404, `Group with id "${id}" not foind`);
		}
		logger.info(`Group delete by ${c.get("user").id}-${c.get("user").name}`, id);
		return c.json(null);
	}
);

export default controller;
