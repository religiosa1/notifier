import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";
import bcrypt from "bcrypt";
import { AuthorizationEnum } from "src/models/AuthorizationEnum";
import { ResultError } from "src/models/Result";
import { db } from "src/db";
import { parseApiKey } from "./apiKey";

export default fp(async function (fastify) {
  fastify.decorate(
    "authorizeKey",
    async function(
      request: FastifyRequest,
      reply: FastifyReply
    ) {
      try {
        const key = (
          Array.isArray(request.headers["x-api-key"])
            ? request.headers["x-api-key"].at(-1)
            : request.headers["x-api-key"]
        ) || (
          fastify.parseCookie(request.headers.cookie || "")["X-API-KEY"]
        ) || "";
        if (!key) {
          throw new ResultError(401, "The API key wasn't supplied in the cookies or headers");
        }
        const [ prefix, id ] = parseApiKey(key);
        const apiKey = await db.apiKey.findUniqueOrThrow({
          where: { prefix },
          include: {
            user: {
              select: { authorizationStatus: true }
            }
          }
        });
        if (apiKey.user.authorizationStatus !== AuthorizationEnum.accepted) {
          throw new ResultError(403, "The user hasn't passed the verification procedure or was declined");
        }
        const match = await bcrypt.compare(id, apiKey.hash);
        if (!match) {
          throw new ResultError(401, "Incorrect api key was supplied");
        }
      } catch (err) {
        const apiErr = ResultError.from(err);
        reply.code(apiErr.statusCode).send(err)
      }
    }
  );
});