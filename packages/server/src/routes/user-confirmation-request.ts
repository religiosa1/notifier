import { Hono } from "hono";
import z from "zod";
import { zValidator } from "@hono/zod-validator";

import { paginationDefaults, pageinationQuerySchema } from "@shared/models/Pagination";
import type * as UserModel from "@shared/models/User";

import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { di } from "src/injection";

import { authorizeJWT } from "src/middleware/authorizeJWT";
import type { Counted } from "@shared/models/Counted";
import type { BatchOperationStats } from "@shared/models/BatchOperationStats";
import type { ContextVariables } from "src/ContextVariables";

const controller = new Hono<{ Variables: ContextVariables }>();
controller.use("*", authorizeJWT);


controller.get("/", zValidator("query", pageinationQuerySchema), async (c) => {
	const userConfirmationRequestsRepository = di.inject("UserConfirmationRequestsRepository");
	const query = c.req.valid("query");
	const { skip, take } = { ...paginationDefaults, ...query };
	const [ data, count ] = await userConfirmationRequestsRepository.listConfirmationRequests({ skip, take });

	return c.json({
		data,
		count,
	} satisfies Counted<UserModel.User[]>);
})

controller.put("/", zValidator("query", z.object({ id: batchIdsSchema })), async (c) => {
	const userConfirmationRequestsRepository = di.inject("UserConfirmationRequestsRepository");
	const logger = di.inject("logger");

	const query = c.req.valid("query");
	const ids = parseIds(query.id);
	const count = await userConfirmationRequestsRepository.acceptConfirmationRequests(ids);

	const data = {
		count,
		outOf: ids.length,
	};
	logger.info(`User batch deny by ${c.get("user").id}-${c.get("user").name}`, data);
	return c.json(data satisfies BatchOperationStats);
});

controller.delete("/", zValidator("query", z.object({ id: batchIdsSchema })), async (c) => {
	const userConfirmationRequestsRepository = di.inject("UserConfirmationRequestsRepository");
	const logger = di.inject("logger");

	const query = c.req.valid("query");
	const ids = parseIds(query.id);

	const count = await userConfirmationRequestsRepository.declineConfirmationRequests(ids);

	const data = {
		count,
		outOf: ids.length,
	};
	logger.info(`User batch deny by ${c.get("user").id}-${c.get("user").name}`, data);
	return c.json(data satisfies BatchOperationStats);
});

export default controller;
