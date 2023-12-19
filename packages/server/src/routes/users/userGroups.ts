import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import type { ContextVariables } from 'src/ContextVariables';
import * as GroupModel from "@shared/models/Group";
import { inject } from "src/injection";
import { userIdParamsSchema } from './models';
import { intGt, toInt } from '@shared/helpers/zodHelpers';

const controller = new Hono<{ Variables: ContextVariables }>();

controller.post(
	'/',
	zValidator("param", userIdParamsSchema),
	zValidator("json", z.object({ name: GroupModel.groupNameSchema })),
	async (c) => {
		const logger = inject("logger");
		const userToGroupRelationsRepository = inject("UserToGroupRelationsRepository");
		const { userId } = c.req.valid("param");
		const { name } = c.req.valid("json");
		await userToGroupRelationsRepository.connectGroupToUser(userId, name);
		logger.info(`Group added to user ${userId} edit by ${c.get("user").id}-${c.get("user").name}`, name);
		return c.json(null);
	}
);

controller.delete(
	"/:groupId",
	zValidator("param", userIdParamsSchema.extend({ 
		groupId: z.string().refine(...intGt(0)).transform(toInt) 
	})),
	async (c) => {
		const userToGroupRelationsRepository = inject("UserToGroupRelationsRepository");
		const { userId, groupId } = c.req.valid("param");
		await userToGroupRelationsRepository.deleteGroupFromUser(userId, groupId);
		return c.json(null);
	}
);

controller.delete(
	"/",
	zValidator("param", userIdParamsSchema),
	async (c) => {
		const userToGroupRelationsRepository = inject("UserToGroupRelationsRepository");
		const { userId } = c.req.valid("param");
		await userToGroupRelationsRepository.deleteAllGroupsFromUser(userId);
		return c.json(null);
	}
)
export default controller;
