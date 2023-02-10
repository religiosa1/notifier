import fp from "fastify-plugin";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { resultSuccessSchema } from "src/Models/Result";
import { paginationSchema, paginationDefaults } from "src/Models/Pagination";
import { userWithGroupSchema, UserWithGroups } from "src/Models/User";
import { db } from "src/db";
import { counted } from "./Models/counted";

export default fp(async function(fastify) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/users",
    schema: {
      querystring: paginationSchema,
      response: {
        200: resultSuccessSchema(counted(z.array(userWithGroupSchema))),
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
          data: users as UserWithGroups[],
        },
      });
    }
  });
});