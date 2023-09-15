import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "@shared/models/Result";
import { serverConfigSchema } from "@shared/models/ServerConfig";
import { inject } from "src/injection";
import { ConfigUnavailableError } from "src/error/ConfigUnavailableError";

export default fp(async function (fastify) {
	const settingsService = inject("SettingsService");

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/settings",
		schema: {
			response: {
				200: resultSuccessSchema(serverConfigSchema),
				403: resultFailureSchema,
				550: resultFailureSchema,
			}
		},
		async handler(req, reply) {
			const config = settingsService.getConfig();
			if (!config) {
				return reply.send(result(new ConfigUnavailableError()));
			}

			await this.authorizeJWT(req, reply);
			return reply.send(result(config));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "PUT",
		url: "/settings",
		schema: {
			body: serverConfigSchema,
			response: {
				200: resultSuccessSchema(z.null()),
				403: resultFailureSchema,
				550: resultFailureSchema,
			}
		},
		async handler(req, reply) {
			const config = settingsService.getConfig();
			if (config) {
				await this.authorizeJWT(req, reply);
			}
			await settingsService.setConfig(req.body);
			return reply.send(result(null));
		}
	});
});
