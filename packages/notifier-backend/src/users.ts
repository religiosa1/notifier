import fp from "fastify-plugin";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { resultSuccessSchema } from "src/Models/Result";
import { paginationSchema, paginationDefaults } from "src/Models/Pagination";
import { userSchema, User } from "src/Models/User";
import { db } from "src/db";

export default fp(async function(fastify) {
  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/users",
    schema: {
      querystring: paginationSchema,
      response: {
        200: resultSuccessSchema(z.array(userSchema)),
      }
    },
    onRequest: fastify.authorizeJWT,
    async handler(req, reply) {
      const { skip, take } = {...paginationDefaults, ...req.query };
      const users = await db.user.findMany({
        skip,
        take,
      });
      return reply.send({
        success: true as true,
        data: users as User[],
      });
    }
  });
});