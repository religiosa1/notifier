import { Hono } from 'hono'
import z from "zod";
import { zValidator } from '@hono/zod-validator'
import { 
	result, 
	// resultSuccessSchema 
} from "@shared/models/Result";
import { paginationDefaults, pageinationQuerySchema } from "@shared/models/Pagination";
// import * as UserModel from "@shared/models/User";
// import { counted } from "@shared/models/Counted";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
// import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { inject } from "src/injection";

const controller = new Hono();
controller.use("*", authorizeJWT);

/**
 * 	200: resultSuccessSchema(counted(z.array(UserModel.userWithGroupsSchema))),
 */
controller.get("/", zValidator("query", pageinationQuerySchema), async (c) => {
	const userConfirmationRequestsRepository = inject('UserConfirmationRequestsRepository');
	const query = c.req.valid('query');
	const { skip, take } = { ...paginationDefaults, ...query };
	const [ data, count ] = await userConfirmationRequestsRepository.listConfirmationRequests({ skip, take });

	return c.json(result({
		data,
		count,
	}));
})

// 200: resultSuccessSchema(batchOperationStatsSchema),
controller.put("/", zValidator("query", z.object({ id: batchIdsSchema })), async (c) => {
	const userConfirmationRequestsRepository = inject('UserConfirmationRequestsRepository');
	// const logger = inject('logger');

	const query = c.req.valid('query');
	const ids = parseIds(query.id);
	const count = await userConfirmationRequestsRepository.acceptConfirmationRequests(ids);

	const data = {
		count,
		outOf: ids.length,
	};
	// logger.info(`User batch deny by ${user.id}-${req.user.name}`, data);
	return c.json(result(data));
});

// 200: resultSuccessSchema(batchOperationStatsSchema),
controller.delete("/", zValidator("query", z.object({ id: batchIdsSchema })), async (c) => {
	const userConfirmationRequestsRepository = inject('UserConfirmationRequestsRepository');
	const query = c.req.valid('query');
	const ids = parseIds(query.id);

	const count = await userConfirmationRequestsRepository.declineConfirmationRequests(ids);

	const data = {
		count,
		outOf: ids.length,
	};
	// fastify.log.info(`User batch deny by ${req.user.id}-${req.user.name}`, data);
	return c.json(result(data));
});

export default controller;

async function authorizeJWT() {
	throw new Error("TODO");
}