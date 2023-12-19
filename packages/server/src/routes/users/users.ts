import { Hono } from 'hono';
import z from "zod";
import { zValidator } from '@hono/zod-validator';

import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { paginationSchema, paginationDefaults, pageinationQuerySchema } from "@shared/models/Pagination";
import * as UserModel from "@shared/models/User";
import { counted } from "@shared/models/Counted";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { inject } from "src/injection";

import  userChannelsController  from "./userChannels";
import  userGroupsController  from "./userGroups";
import  userKeysController  from "./userKeys";
import { userIdParamsSchema } from './models';
import { intGt, toInt } from '@shared/helpers/zodHelpers';
import { authorizeJWT } from 'src/middleware/authorizeJWT';

const controller = new Hono();
controller.use("*", authorizeJWT);

controller.route("/channels", userChannelsController);
controller.route("/groups", userGroupsController);
controller.route("/api-keys", userKeysController);

const usersRepository = inject("UsersRepository");

controller.get("/", zValidator("query", pageinationQuerySchema), async (c) => {
	const { skip, take } = { ...paginationDefaults, ...c.req.valid("query") };
	const [data, count] = await usersRepository.listUsers({ skip, take });

	return c.json(result({
		data,
		count,
	}));
});

controller.post("/", zValidator("json", UserModel.userCreateSchema), async (c) => {
	const user = await usersRepository.insertUser(c.req.valid("json"));
	// fastify.log.info(`User create by ${req.user.id}-${req.user.name}`, req.body);
	return c.json(result(user));
});

controller.delete("/", zValidator("query", z.object({ id: batchIdsSchema })), async (c) => {
	const ids = parseIds(c.req.valid("query").id);
	const count = await usersRepository.deleteUsers(ids);
	const data = {
		count,
		outOf: ids.length,
	};
	// fastify.log.info(`User batch delete by ${req.user.id}-${req.user.name}`, ids, data);
	return c.json(result(data));
});

controller.get(
	"/:userId",
	zValidator("param", userIdParamsSchema),
	async (c) => {
		const { userId } = c.req.valid("param");
		const user = await usersRepository.getUserDetail(userId);
		return c.json(result(user));
	}
);

controller.put(
	"/:userId",
	zValidator("param", userIdParamsSchema),
	zValidator("json",  UserModel.userUpdateSchema),
	async (c) => {
		const { userId } = c.req.valid("param");
		const body = c.req.valid("json");
		const user = await usersRepository.updateUser(userId, body);

		// fastify.log.info(`User ${userId} edit by ${req.user.id}-${req.user.name}`, req.body);
		return c.json(result(user));
	}
);

controller.delete(
	"/:userId",
	zValidator("param", userIdParamsSchema),
	async (c) => {
		const {userId} = c.req.valid("param");
		await usersRepository.assertUserExists(userId);
		await usersRepository.deleteUsers([userId])
		// fastify.log.info(`User ${userId} delete by ${req.user.id}-${req.user.name}`);
		return c.json(result(null));
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
		return c.json(result(users));
	} 
);

export default controller;
