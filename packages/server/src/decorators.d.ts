import * as fastify from "fastify";
import * as http from "http";
import type { TokenPayload } from "src/models/TokenPayload";

declare module "fastify" {
	export interface FastifyInstance<
		HttpServer = http.Server,
		HttpRequest = http.IncomingMessage,
		HttpResponse = http.ServerResponse,
		Logger extends FastifyBaseLogger = FastifyBaseLogger,
		TypeProvider extends FastifyTypeProvider = FastifyTypeProviderDefault,
	> {
		authorizeJWT: (request: FastifyRequest, reply: FastifyReply) => Promise<unknown>,
		authorizeKey: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authorizeAnyMethod: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
	}

	export interface FastifyRequest {
		user: TokenPayload
	}
}