import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import * as GroupModel from "@shared/models/Group";
import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import type { ContextVariables } from 'src/ContextVariables';
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { di } from "src/injection";

import { intGt, toInt } from '@shared/helpers/zodHelpers';

const baseGroupUsersParams = z.object({
	groupId: z.string().refine(...intGt(0)).transform(toInt)
});

const controller = new Hono<{ Variables: ContextVariables }>();

controller.post(
	"/", 
	zValidator("param", baseGroupUsersParams),
	zValidator("json",  z.object({ name: z.string().min(1), })),
	async (c) => {
		const logger = di.inject("logger");
		const groupsRepository = di.inject("GroupsRepository");
		const usersToGroupRelationRepository = di.inject("UserToGroupRelationsRepository");

		const { groupId } = c.req.valid("param");
		const { name } = c.req.valid("json");

		await usersToGroupRelationRepository.connectUserToGroup(groupId, name);
		const group = await groupsRepository.getGroupDetail(groupId);

		logger.info(`Groups updated by ${c.get("user").id}-${c.get("user").name}`, group);
		return c.json(group satisfies GroupModel.GroupDetail);
	}
);

controller.delete(
	"/", 
	zValidator("param", baseGroupUsersParams),
	zValidator("query", z.object({ id: z.optional(batchIdsSchema) })),
	async (c) => {
		const logger = di.inject("logger");
		const usersToGroupRelationRepository = di.inject("UserToGroupRelationsRepository");

		const { groupId } = c.req.valid("param");
		const idsQuery = c.req.valid("query").id
		const ids = idsQuery !== undefined ? parseIds(idsQuery) : undefined;

		const count = await usersToGroupRelationRepository.deleteUserFromGroup(groupId, ids);

		const data = {
			count,
			outOf: ids?.length ?? -1,
		};
		logger.info(`Groups users batch disconnect by ${c.get("user").id}-${c.get("user").name}`, data);
		return c.json(data satisfies BatchOperationStats);
	}
)

export default controller;
