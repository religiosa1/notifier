import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import * as UserModel from "@shared/models/User";
import { paginationDefaults, pageinationQuerySchema } from "@shared/models/Pagination";
import type { Counted } from "@shared/models/Counted";
import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { inject } from "src/injection";

import  userChannelsController  from "./userChannels";
import  userGroupsController  from "./userGroups";
import  userKeysController  from "./userKeys";
import { userIdParamsSchema } from './models';
import { intGt, toInt } from '@shared/helpers/zodHelpers';
import { authorizeJWT } from 'src/middleware/authorizeJWT';
import type { ContextVariables } from 'src/ContextVariables';

const controller = new Hono<{ Variables: ContextVariables }>();
controller.use("*", authorizeJWT);

controller.route("/channels", userChannelsController);
controller.route("/groups", userGroupsController);
controller.route("/api-keys", userKeysController);

const usersRepository = inject("UsersRepository");

controller.get("/", zValidator("query", pageinationQuerySchema), async (c) => {
	const { skip, take } = { ...paginationDefaults, ...c.req.valid("query") };
	const [data, count] = await usersRepository.listUsers({ skip, take });

	return c.json({
		data,
		count,
	} satisfies Counted<UserModel.User[]>);
});

controller.post("/", zValidator("json", UserModel.userCreateSchema), async (c) => {
	const logger = inject("logger");
	const body = c.req.valid("json");
	const user = await usersRepository.insertUser(body);
	logger.info(`User create by ${c.get("user").id}-${c.get("user").name}`,body);
	return c.json(user satisfies UserModel.UserDetail);
});

controller.delete("/", zValidator("query", z.object({ id: batchIdsSchema })), async (c) => {
	const logger = inject("logger");
	const ids = parseIds(c.req.valid("query").id);
	const count = await usersRepository.deleteUsers(ids);
	const data = {
		count,
		outOf: ids.length,
	};
	logger.info(`User batch delete by ${c.get("user").id}-${c.get("user").name}`, ids, data);
	return c.json(data satisfies BatchOperationStats);
});

controller.get(
	"/:userId",
	zValidator("param", userIdParamsSchema),
	async (c) => {
		const { userId } = c.req.valid("param");
		const user = await usersRepository.getUserDetail(userId);
		return c.json(user satisfies UserModel.UserDetail);
	}
);

controller.put(
	"/:userId",
	zValidator("param", userIdParamsSchema),
	zValidator("json",  UserModel.userUpdateSchema),
	async (c) => {
		const logger = inject("logger");
		const { userId } = c.req.valid("param");
		const body = c.req.valid("json");
		const user = await usersRepository.updateUser(userId, body);

		logger.info(`User ${userId} edit by ${c.get("user").id}-${c.get("user").name}`, body);
		return c.json(user satisfies UserModel.UserDetail);
	}
);

controller.delete(
	"/:userId",
	zValidator("param", userIdParamsSchema),
	async (c) => {
		const logger = inject("logger");
		const {userId} = c.req.valid("param");
		await usersRepository.assertUserExists(userId);
		await usersRepository.deleteUsers([userId])
		logger.info(`User ${userId} delete by ${c.get("user").id}-${c.get("user").name}`);
		return c.json(null);
	}
);

controller.get(
	"/search",
	zValidator("query",  z.object({
		name: z.string().optional(),
		group: z.string().refine(...intGt(0)).transform(toInt).optional(),
	})),
	async (c) => {
		const { name, group } = c.req.valid("query");
		const users = await usersRepository.searchUsers({ name, groupId: group });
		return c.json(users satisfies UserModel.User[]);
	} 
);

export default controller;
