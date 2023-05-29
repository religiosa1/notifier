import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "src/db";
import type { FastifyInstance } from "fastify";
import { result, resultFailureSchema, resultSuccessSchema } from "src/models/Result";
import { paginationDefaults, paginationSchema } from "src/models/Pagination";
import { counted } from "src/models/Counted";
import { apiKeyPrefixSchema, apiKeyPreviewSchema } from "src/models/ApiKey";
import { generateApiKey, parseApiKey } from "src/Authorization/apiKey";
import { hash } from "src/Authorization/hash";

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
			const [count, data] = await db.$transaction([
				db.apiKey.count({ where: { userId } }),
				db.apiKey.findMany({
					skip,
					take,
					select: { prefix: true, createdAt: true },
					where: { userId }
				}),
			]);
			return reply.send(result({ count, data }));
		}
	});


	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "PUT",
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
			const apiKey = generateApiKey();
			const [ prefix, key ] = parseApiKey(apiKey);
			const hashedKey = await hash(key);
			await db.apiKey.create({
				data: {
					prefix: prefix,
					hash: hashedKey,
					userId
				}
			});
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
			// Specifically doing it through the user, so we control, that userId is correct
			await db.user.update({
				where: { id: userId },
				data: { ApiKeys: { delete: { prefix } } }
			})
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