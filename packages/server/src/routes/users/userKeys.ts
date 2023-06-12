import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import type { FastifyInstance } from "fastify";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { paginationDefaults, paginationSchema } from "@shared/models/Pagination";
import { counted } from "@shared/models/Counted";
import { apiKeyPrefixSchema, apiKeyPreviewSchema } from "@shared/models/ApiKey";
import { db } from "src/db";
import * as ApiKeyService from "src/services/ApiKey";

export function userKeys<Instace extends FastifyInstance>(fastify: Instace) {
	const baseUserKeysUrl = "/users/:userId/api-keys";
	const baseUserKeysParams = z.object({
		userId: z.number({ coerce: true }).int().gt(0),
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: baseUserKeysUrl,
		schema: {
			params: baseUserKeysParams,
			querystring: paginationSchema,
			response: {
				200: resultSuccessSchema(counted(z.array(apiKeyPreviewSchema))),
				404: resultFailureSchema,
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { userId } = req.params;
			const { skip, take } = { ...paginationDefaults, ...req.query };
			const [data, count] = await ApiKeyService.getKeys(db, userId, { skip, take });
			return reply.send(result({ count, data }));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: baseUserKeysUrl,
		schema: {
			params: baseUserKeysParams,
			response: {
				200: resultSuccessSchema(z.object({
					apiKey: z.string(),
				}))
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req) {
			const { userId } = req.params;
			const apiKey = await ApiKeyService.createKey(db, userId);
			return result({ apiKey });
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: baseUserKeysUrl + "/:prefix",
		schema: {
			params: baseUserKeysParams.extend({
				prefix: apiKeyPrefixSchema,
			}),
			response: {
				200: resultSuccessSchema(z.null())
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req) {
			const { prefix, userId } = req.params;
			await ApiKeyService.deleteKey(db, userId, prefix);
			return result(null);
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: baseUserKeysUrl,
		schema: {
			params: baseUserKeysParams,
			response: {
				200: resultSuccessSchema(z.number().int()),
				404: resultFailureSchema,
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req) {
			const { userId } = req.params;
			const { count } = await db.apiKey.deleteMany({ where: { user: { id: userId } } });
			return result(count);
		}
	});
}