import * as fastify from "fastify";
import * as http from "http";
import type { TokenPayload } from "src/models/TokenPayload";

declare module "fastify" {
  export interface FastifyInstance<
    HttpServer = http.Server,
    HttpRequest = http.IncomingMessage,
    HttpResponse = http.ServerResponse
  > {
    authorizeJWT(): void;
    authorizeKey(): void;
  }

  // TODO Implement model for JWT payload
  export interface FastifyRequest {
    user: TokenPayload
  }
}