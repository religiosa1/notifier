import fp from "fastify-plugin";
import z from "zod";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, ResultError, resultFailureSchema, resultSuccessSchema } from "src/models/Result";
import { paginationSchema, paginationDefaults } from "src/models/Pagination";
import * as UserModel from "src/models/User";
import { db } from "src/db";
import { counted } from "src/models/Counted";
import { omit } from "src/helpers/omit";
import { hash } from 'src/Authorization/hash';

export default fp(async function(fastify) {
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
      return reply.send({
        success: true as true,
        data: {
          count,
          data: users as UserModel.UserWithGroups[],
        },
      });
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/users/:userId",
    schema: {
      response: {
        200: resultSuccessSchema(UserModel.userDetailSchema),
        404: resultFailureSchema
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.id;
      const user = await db.user.findUnique({
        where: { id },
        include: {
          groups: { select: { id: true, name: true }},
          channels: { select: { id: true, name: true }},
        }
      }) as UserModel.UserDetail | null;
      if (!user) {
        throw new ResultError(404, `user with id '${id}' doesn't exist`);
      }
      return reply.send(result(user));
    }
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/users/:userId",
    schema: {
      body: UserModel.userUpdateSchema,
      response: {
        200: resultSuccessSchema(UserModel.userDetailSchema),
        404: resultFailureSchema
      },
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.id;
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
      }) as UserModel.UserDetail;
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
        404: resultFailureSchema
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
      response: {
        200: resultSuccessSchema(z.null()),
        404: resultFailureSchema
      },
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const id = req.id;
      const user = await db.user.delete({
        where: { id },
      });
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