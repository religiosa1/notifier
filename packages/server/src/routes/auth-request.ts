import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "src/db";
import { result, resultSuccessSchema } from "src/models/Result";
import { paginationSchema, paginationDefaults } from "src/models/Pagination";
import * as UserModel from "src/models/User";
import { counted } from "src/models/Counted";
import { parseIds, batchIdsSchema } from "src/models/batchIds";
import { batchOperationStatsSchema } from "src/models/BatchOperationStats";
import { AuthorizationEnum } from "src/models/AuthorizationEnum";

export default fp(async function(fastify) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/auth-request",
    schema: {
      querystring: paginationSchema,
      response: {
        200: resultSuccessSchema(counted(z.array(UserModel.userWithGroupsSchema))),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const { skip, take } = {...paginationDefaults, ...req.query };
      const [ count, users ] = await db.$transaction([
        db.user.count({
          where: { authorizationStatus: AuthorizationEnum.pending }
        }),
        db.user.findMany({
          skip,
          take,
          include: {
            groups: {
              select: { id: true, name: true }
            }
          },
          where: { authorizationStatus: AuthorizationEnum.pending }
        }),
      ]);
      return reply.send(result({
        count,
        data: users as UserModel.UserWithGroups[],
      }));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/auth-request",
    schema: {
      querystring: z.object({ id: batchIdsSchema}),
      response: {
        200: resultSuccessSchema(batchOperationStatsSchema),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const ids = parseIds(req.query.id);
      const { count } = await db.user.updateMany({
          where: {
            id: { in: ids }
          },
          data: {
            authorizationStatus: AuthorizationEnum.declined
          }
      });
      const data = {
        count,
        outOf: ids.length,
      };
      fastify.log.info(`User batch deny by ${req.user.id}-${req.user.name}`, data);
      return reply.send(result(data));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/auth-request",
    schema: {
      querystring: z.object({ id: batchIdsSchema}),
      response: {
        200: resultSuccessSchema(batchOperationStatsSchema),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const ids = parseIds(req.query.id);
      const { count } = await db.user.updateMany({
          where: {
            id: { in: ids }
          },
          data: {
            authorizationStatus: AuthorizationEnum.accepted
          }
      });
      const data = {
        count,
        outOf: ids.length,
      };
      fastify.log.info(`User batch deny by ${req.user.id}-${req.user.name}`, data);
      return reply.send(result(data));
    }
  });
});