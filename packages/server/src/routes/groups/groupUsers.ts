import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import * as GroupModel from "@shared/models/Group";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { inject } from "src/injection";
import { intGt, toInt } from '@shared/helpers/zodHelpers';


const baseGroupUsersParams = z.object({
	groupId: z.string().refine(...intGt(0)).transform(toInt)
});

const controller = new Hono();

controller.post(
	"/", 
	zValidator("param", baseGroupUsersParams),
	zValidator("json",  z.object({ name: z.string().min(1), })),
	async (c) => {
		const groupsRepository = inject("GroupsRepository");
		const usersToGroupRelationRepository = inject("UserToGroupRelationsRepository");

		const { groupId } = c.req.valid("param");
		const { name } = c.req.valid("json");

		await usersToGroupRelationRepository.connectUserToGroup(groupId, name);
		const group = await groupsRepository.getGroupDetail(groupId);

		// fastify.log.info(`Groups updated by ${req.user.id}-${req.user.name}`, group);
		return c.json(result(group));
	}
);

controller.delete(
	"/", 
	zValidator("param", baseGroupUsersParams),
	zValidator("query", z.object({ id: z.optional(batchIdsSchema) })),
	async (c) => {
		const usersToGroupRelationRepository = inject("UserToGroupRelationsRepository");

		const { groupId } = c.req.valid("param");
		const idsQuery = c.req.valid("query").id
		const ids = idsQuery !== undefined ? parseIds(idsQuery) : undefined;

		const count = await usersToGroupRelationRepository.deleteUserFromGroup(groupId, ids);

		const data = {
			count,
			outOf: ids?.length ?? -1,
		};
		// fastify.log.info(`Groups users batch disconnect by ${req.user.id}-${req.user.name}`, data);
		return c.json(result(data));
	}
)

export default controller;
