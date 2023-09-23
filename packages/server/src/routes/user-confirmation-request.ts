import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultSuccessSchema } from "@shared/models/Result";
import { paginationSchema, paginationDefaults } from "@shared/models/Pagination";
import * as UserModel from "@shared/models/User";
import { counted } from "@shared/models/Counted";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { inject } from "src/injection";

export default fp(async function (fastify) {
	const userConfirmationRequestsRepository = inject("UserConfirmationRequestsRepository");

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/user-confirmation-request",
		schema: {
			querystring: paginationSchema,
			response: {
				200: resultSuccessSchema(counted(z.array(UserModel.userWithGroupsSchema))),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { skip, take } = { ...paginationDefaults, ...req.query };
			const [ data, count ] = await userConfirmationRequestsRepository.listConfirmationRequests({ skip, take });

			return reply.send(result({
				data,
				count,
			}));
		}
	});


	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "PUT",
		url: "/user-confirmation-request",
		schema: {
			querystring: z.object({ id: batchIdsSchema }),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {

			const ids = parseIds(req.query.id);
			const count = await userConfirmationRequestsRepository.acceptConfirmationRequests(ids);

			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`User batch deny by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/user-confirmation-request",
		schema: {
			querystring: z.object({ id: batchIdsSchema }),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const ids = parseIds(req.query.id);

			const count = await userConfirmationRequestsRepository.declineConfirmationRequests(ids);

			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`User batch deny by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});
});