import fp from "fastify-plugin";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultFailureSchema, resultSuccessSchema } from "src/models/Result";
import { paginationSchema, paginationDefaults } from "src/models/Pagination";
import { batchOperationStatsSchema } from "src/models/BatchOperationStats";
import * as UserModel from "src/models/User";
import { db } from "src/db";
import { counted } from "src/models/Counted";
import { omit } from "src/helpers/omit";
import { hash } from 'src/Authorization/hash';
import { parseIds, batchIdsSchema } from "src/models/batchIds";
import { handlerDbNotFound } from "src/error/handlerRecordNotFound";

export default fp(async function(fastify) {
  const userNotFound = (id: string | number) => `user with id '${id}' doesn't exist`;
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/users",
    schema: {
      querystring: paginationSchema,
      response: {
        200: resultSuccessSchema(counted(z.array(UserModel.userWithGroupsSchema))),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const { skip, take } = {...paginationDefaults, ...req.query };
      // why Prisma is so stupid?..
      // https://github.com/prisma/prisma/issues/7550
      const [ count, users ] = await db.$transaction([
        db.user.count(),
        db.user.findMany({
          skip,
          take,
          include: {
            groups: {
              select: { id: true, name: true }
            }
          }
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
    url: "/users",
    schema: {
      querystring: z.object({ id: batchIdsSchema}),
      response: {
        200: resultSuccessSchema(batchOperationStatsSchema),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const ids = parseIds(req.query.id);
      const { count } = await db.user.deleteMany({
          where: {
            id: { in: ids }
          }
      });
      const data = {
        count,
        outOf: ids.length,
      };
      fastify.log.info(`User batch delete by ${req.user.id}-${req.user.name}`, data);
      return reply.send(result(data));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/users/:userId",
    schema: {
      params: z.object({
        userId: z.number({ coerce: true})
      }),
      response: {
        200: resultSuccessSchema(UserModel.userDetailSchema),
        404: resultFailureSchema
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.params.userId;
      const user = await db.user.findUniqueOrThrow({
        where: { id },
        include: {
          groups: { select: { id: true, name: true }},
          channels: { select: { id: true, name: true }},
        }
      }).catch(handlerDbNotFound(userNotFound(id))) as UserModel.UserDetail;
      return reply.send(result(user));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/users/:userId",
    schema: {
      params: z.object({
        userId: z.number({ coerce: true})
      }),
      body: UserModel.userUpdateSchema,
      response: {
        200: resultSuccessSchema(UserModel.userDetailSchema),
        404: resultFailureSchema
      },
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.params.userId;
      const user = await db.user.update({
        where: { id },
        data: {
          ...omit(req.body, ["channels", "groups", "password"]),
          password: await hash(req.body.password),
          groups: idArrayToConnect(req.body.groups),
          channels: idArrayToConnect(req.body.channels),
        },
        include: {
          groups: { select: { id: true, name: true }},
          channels: { select: { id: true, name: true }},
        }
      }).catch(handlerDbNotFound(userNotFound(id))) as UserModel.UserDetail;
      fastify.log.info(`User edit by ${req.user.id}-${req.user.name}`, req.body);
      return reply.send(result(user));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/users",
    schema: {
      body: UserModel.userCreateSchema,
      response: {
        200: resultSuccessSchema(UserModel.userDetailSchema),
      },
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const user = await db.user.create({
        data: {
          ...omit(req.body, ["channels", "groups", "password"]),
          password: await hash(req.body.password),
        },
        include: {
          groups: { select: { id: true, name: true }},
          channels: { select: { id: true, name: true }},
        }
      }) as UserModel.UserDetail;
      fastify.log.info(`User create by ${req.user.id}-${req.user.name}`, req.body);
      return reply.send(result(user));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "DELETE",
    url: "/users/:userId",
    schema: {
      params: z.object({
        userId: z.number({ coerce: true})
      }),
      response: {
        200: resultSuccessSchema(z.null()),
        404: resultFailureSchema
      },
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.params.userId;
      const user = await db.user.delete({
        where: { id },
      }).catch(handlerDbNotFound(userNotFound(id)));
      fastify.log.info(`User delete by ${req.user.id}-${req.user.name}`, user);
      return reply.send(result(null));
    }
  });
});

function idArrayToConnect(arr: number[] | undefined | null) {
  if (!arr || !Array.isArray(arr)) {
    return;
  }
  return {
    connect: arr.map(i => ({ id: Number(i) })),
  };
}