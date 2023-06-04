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
import { omit } from "src/helpers/omit";
import { groupNameSchema } from "src/models/Group";

export default fp(async function(fastify) {
  const channelNotFound = (id: string | number) => `channel with id '${id}' doesn't exist`;

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/channels",
    schema: {
      querystring: paginationSchema,
      response: {
        200: resultSuccessSchema(counted(z.array(ChannelModel.channelSchema.extend({
          usersCount: z.number(),
          groupsCount: z.number(),
        })))),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const { skip, take } = {...paginationDefaults, ...req.query };
      const [ count, channels ] = await db.$transaction((tx) => {
        const countPrms = tx.channel.count();
        const channelPrms = tx.channel.findMany({
          skip,
          take,
          include: {
            Groups: { select: { id: true } },
            userChannels: {
              select: { userId: true },
              distinct: ['userId'],
            }
          }
        }).then(channels => channels.map(channel => ({
          ...omit(channel, ["Groups", "userChannels"]),
          groupsCount: channel.Groups.length,
          usersCount: channel.userChannels.length,
        })));
        return Promise.all([
          countPrms,
          channelPrms,
        ]);
      });
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
    method: "POST",
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
    method: "GET",
    url: "/channels/:channelId",
    schema: {
      params: z.object({
        channelId: z.number({ coerce: true}).int().gt(0),
      }),
      response: {
        200: resultSuccessSchema(ChannelModel.channelDetailSchema),
        404: resultFailureSchema
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.params.channelId;
      const channel = await db.channel.findUniqueOrThrow({
        where: { id },
        include: { Groups: true },
      }).catch(handlerDbNotFound(channelNotFound(id)))
      return reply.send(result(channel));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/channels/:channelId",
    schema: {
      params: z.object({
        channelId: z.number({ coerce: true}).int().gt(0),
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
    method: "DELETE",
    url: "/channels/:channelId",
    schema: {
      params: z.object({
        channelId: z.number({ coerce: true}).int().gt(0),
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

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/channels/:channelId/groups",
    schema: {
      params: z.object({
        channelId: z.number({ coerce: true }).int().gt(0),
      }),
      body: z.object({
        name: groupNameSchema,
      }),
      response: {
        200: resultSuccessSchema(ChannelModel.channelDetailSchema),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const { name }= req.body;
      const data = await db.channel.update({
        where: { id: req.params.channelId },
        include: {
          Groups: true
        },
        data: {
          Groups: { connectOrCreate: {
            where: { name },
            create: { name },
          }}
        }
      });
      fastify.log.info(`Channel group added by ${req.user.id}-${req.user.name}`, data);
      return reply.send(result(data));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/channels/:channelId/groups",
    schema: {
      params: z.object({
        channelId: z.number({ coerce: true }).int().gt(0),
      }),
      querystring: z.object({ id: z.optional(batchIdsSchema) }),
      response: {
        200: resultSuccessSchema(batchOperationStatsSchema),
        404: resultFailureSchema,
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const ids = parseIds(req.query.id || "");
      const groupsAction = ids.length
        ? { disconnect: ids.map(id => ({ id })) }
        : { set: [] }
      const groupsFilter = ids.length
        ? { id: { in: ids} }
        : {}
      const response = await db.channel.update({
        where: { id: req.params.channelId },
        include: {
          Groups: { select: { id: true },
          where: groupsFilter
        }},
        data: {
          Groups: groupsAction
        }
      });
      const data = {
        count: response.Groups.length,
        outOf: ids.length,
      };
      fastify.log.info(`Channel groups batch disconnect by ${req.user.id}-${req.user.name}`, data);
      return reply.send(result(data));
    }
  });
});