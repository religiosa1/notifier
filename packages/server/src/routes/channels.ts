import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "src/models/Result";
import { db } from "src/db";
import * as ChannelModel from "src/models/Channel";
import { counted } from "src/models/Counted";
import { paginationSchema, paginationDefaults } from "src/models/Pagination";
import { batchOperationStatsSchema } from "src/models/BatchOperationStats";
import { parseIds, batchIdsSchema } from "src/models/batchIds";
import { handlerDbNotFound } from "src/error/handlerRecordNotFound";
import { handlerUniqueViolation } from "src/error/handlerUniqueViolation";

export default fp(async function(fastify) {
  const channelNotFound = (id: string | number) => `channel with id '${id}' doesn't exist`;

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/channels",
    schema: {
      querystring: paginationSchema,
      response: {
        200: resultSuccessSchema(counted(z.array(ChannelModel.channelSchema))),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const { skip, take } = {...paginationDefaults, ...req.query };
      const [ count, channels ] = await db.$transaction([
        db.channel.count(),
        db.channel.findMany({
          skip,
          take,
        }),
      ]);
      return reply.send(result({
        count,
        data: channels,
      }));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/channels/search",
    schema: {
      querystring: z.object({
        name: z.string().optional()
      }),
      response: {
        200: resultSuccessSchema(z.array(ChannelModel.channelSchema)),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const channels = await db.channel.findMany({
        where: {
          name: { contains: req.query.name }
        }
      });
      return reply.send(result(channels));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/channels",
    schema: {
      body: ChannelModel.channelCreateSchema,
      response: {
        200: resultSuccessSchema(ChannelModel.channelSchema),
        409: resultFailureSchema,
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const channel = await db.channel.create({
        data: {
          name: req.body.name,
        }
      }).catch(handlerUniqueViolation());
      fastify.log.info(`Channel created by ${req.user.id}-${req.user.name}`, channel);
      return reply.send(result(channel));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/channels/:channelId",
    schema: {
      params: z.object({
        channelId: z.number({ coerce: true})
      }),
      response: {
        200: resultSuccessSchema(z.null()),
        404: resultFailureSchema
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.params.channelId;
      const channel = await db.channel.delete({
        where: { id }
      }).catch(handlerDbNotFound(channelNotFound(id)));
      fastify.log.info(`Channel delete by ${req.user.id}-${req.user.name}`, channel);
      return reply.send(result(null));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/channels/:channelId",
    schema: {
      params: z.object({
        channelId: z.number({ coerce: true})
      }),
      body: ChannelModel.channelUpdateSchema,
      response: {
        200: resultSuccessSchema(ChannelModel.channelSchema),
        404: resultFailureSchema,
        409: resultFailureSchema,
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.params.channelId;
      const channel = await db.channel.update({
        where: { id },
        data: req.body,
      })
        .catch(handlerDbNotFound(channelNotFound(id)))
        .catch(handlerUniqueViolation());
      fastify.log.info(`Channel update by ${req.user.id}-${req.user.name}`, channel);
      return reply.send(result(channel));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/channels/:channelId",
    schema: {
      params: z.object({
        channelId: z.number({ coerce: true})
      }),
      response: {
        200: resultSuccessSchema(ChannelModel.channelSchema),
        404: resultFailureSchema
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.params.channelId;
      const channel = await db.channel.findUniqueOrThrow({
        where: { id }
      }).catch(handlerDbNotFound(channelNotFound(id)))
      return reply.send(result(channel));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/channels",
    schema: {
      querystring: z.object({ id: batchIdsSchema }),
      response: {
        200: resultSuccessSchema(batchOperationStatsSchema),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const ids = parseIds(req.query.id);
      const { count } = await db.channel.deleteMany({
          where: {
            id: { in: ids }
          }
      });
      const data = {
        count,
        outOf: ids.length,
      };
      fastify.log.info(`Channel batch delete by ${req.user.id}-${req.user.name}`, data);
      return reply.send(result(data));
    }
  });
});