import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import * as GroupModel from "@shared/models/Group";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { inject } from "src/injection";
import { userIdParamsSchema } from './models';
import { intGt, toInt } from '@shared/helpers/zodHelpers';

const controller = new Hono();

controller.post(
	'/',
	zValidator("param", userIdParamsSchema),
	zValidator("json", z.object({ name: GroupModel.groupNameSchema })),
	async (c) => {
		const userToGroupRelationsRepository = inject("UserToGroupRelationsRepository");
		const { userId: id } = c.req.valid("param");
		const { name } = c.req.valid("json");
		await userToGroupRelationsRepository.connectGroupToUser(id, name);
		// fastify.log.info(`Group added to user ${req.params.userId} edit by ${req.user.id}-${req.user.name}`, req.body);
		return c.json(result(null));
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
		return c.json(result(null));
	}
);

controller.delete(
	"/",
	zValidator("param", userIdParamsSchema),
	async (c) => {
		const userToGroupRelationsRepository = inject("UserToGroupRelationsRepository");
		const { userId } = c.req.valid("param");
		await userToGroupRelationsRepository.deleteAllGroupsFromUser(userId);
		return c.json(result(null));
	}
)
export default controller;
