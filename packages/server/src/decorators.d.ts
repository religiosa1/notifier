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
		authorizeJWT: (request: any, reply: any) => Promise<void>;
		authorizeKey: (request: any, reply: any) => Promise<void>; // (request: FastifyRequest, reply: FastifyReply) => Promise<void>
		authorizeAnyMethod: () => void; // (request: FastifyRequest, reply: FastifyReply) => Promise<void>
	}

	export interface FastifyRequest {
		user: TokenPayload
	}
}