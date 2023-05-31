import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "src/models/Result";
import { db } from "src/db";
import * as GroupModel from "src/models/Group";
import { counted } from "src/models/Counted";
import { paginationSchema, paginationDefaults } from "src/models/Pagination";
import { batchOperationStatsSchema } from "src/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "src/models/batchIds";
import { handlerDbNotFound } from "src/error/handlerRecordNotFound";
import { handlerUniqueViolation } from "src/error/handlerUniqueViolation";
import { omit } from "src/helpers/omit";

export default fp(async function(fastify) {
  const groupNotFound = (id: string | number) => `group with id '${id}' doesn't exist`;

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/groups",
    schema: {
      querystring: paginationSchema,
      response: {
        200: resultSuccessSchema(counted(z.array(GroupModel.groupSchema.extend({
          channelsCount: z.number(),
          usersCount: z.number(),
        })))),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const { skip, take } = {...paginationDefaults, ...req.query };
      const [ count, groups ] = await db.$transaction((tx) => {
        const countPrms = tx.group.count();
        const groupsPrms = tx.group.findMany({
          skip,
          take,
          include: {
            Users: { select: { id: true } },
            Channels: { select: { id: true } },
          },
        }).then((groups) => groups.map((i) => ({
          ...omit(i, ["Users", "Channels"]),
          channelsCount: i.Channels.length,
          usersCount: i.Users.length,
        })));
        return Promise.all([
          countPrms,
          groupsPrms,
        ])
      });
      return reply.send(result({
        count,
        data: groups,
      }));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/groups/search",
    schema: {
      querystring: z.object({
        name: z.string().optional()
      }),
      response: {
        200: resultSuccessSchema(z.array(GroupModel.groupSchema)),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const groups = await db.group.findMany({
        where: {
          name: { contains: req.query.name }
        }
      });
      return reply.send(result(groups));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/groups",
    schema: {
      body: GroupModel.groupCreateSchema,
      response: {
        200: resultSuccessSchema(GroupModel.groupSchema),
        409: resultFailureSchema,
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const group = await db.group.create({
        data: {
          name: req.body.name,
        }
      }).catch(handlerUniqueViolation());
      fastify.log.info(`Group created by ${req.user.id}-${req.user.name}`, group);
      return reply.send(result(group));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/groups/:groupId",
    schema: {
      params: z.object({
        groupId: z.number({ coerce: true}).int().gt(0),
      }),
      response: {
        200: resultSuccessSchema(GroupModel.groupSchema),
        404: resultFailureSchema
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.params.groupId;
      const group = await db.group.findUniqueOrThrow({
        where: { id }
      }).catch(handlerDbNotFound(groupNotFound(id)))
      return reply.send(result(group));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/groups/:groupId",
    schema: {
      params: z.object({
        groupId: z.number({ coerce: true}).int().gt(0),
      }),
      body: GroupModel.groupUpdateSchema,
      response: {
        200: resultSuccessSchema(GroupModel.groupSchema),
        404: resultFailureSchema,
        409: resultFailureSchema,
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.params.groupId;
      const group = await db.group.update({
        where: { id },
        data: req.body,
      })
        .catch(handlerDbNotFound(groupNotFound(id)))
        .catch(handlerUniqueViolation());
      fastify.log.info(`Group update by ${req.user.id}-${req.user.name}`, group);
      return reply.send(result(group));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/groups/:groupId",
    schema: {
      params: z.object({
        groupId: z.number({ coerce: true}).int().gt(0),
      }),
      response: {
        200: resultSuccessSchema(z.null()),
        404: resultFailureSchema
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.params.groupId;
      const group = await db.group.delete({
        where: { id }
      }).catch(handlerDbNotFound(groupNotFound(id)));
      fastify.log.info(`Group delete by ${req.user.id}-${req.user.name}`, group);
      return reply.send(result(null));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/groups",
    schema: {
      querystring: z.object({ id: batchIdsSchema }),
      response: {
        200: resultSuccessSchema(batchOperationStatsSchema),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const ids = parseIds(req.query.id);
      const { count } = await db.group.deleteMany({
          where: {
            id: { in: ids }
          }
      });
      const data = {
        count,
        outOf: ids.length,
      };
      fastify.log.info(`Group batch delete by ${req.user.id}-${req.user.name}`, data);
      return reply.send(result(data));
    }
  });
});