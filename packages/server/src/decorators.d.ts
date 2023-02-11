import * as fastify from "fastify";
import * as http from "http";

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
    user: { name: string, id: number, iat: number, exp: number }
  }
}