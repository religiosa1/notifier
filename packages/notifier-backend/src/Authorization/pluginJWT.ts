import { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import bcrypt from "bcrypt";
import { ResultError, resultFailureSchema, resultSuccessSchema } from "src/Models/Result";
import { result } from "src/Models/Result";
import { db } from "src/db";

export default fp(async function(fastify) {
  if (!process.env.JWT_SECRET) {
    throw new Error(
      "JWT secret is missing in env. Please, generate a secret with " +
      "npm run generate-secret and add it to the environemnt"
    );
  }

  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET,
  });

  fastify.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: '/login',
    attachValidation: true,
    schema: {
      body: z.object({
        name: z.string().max(32),
        password: z.string().max(32),
      }),
      response: {
        200: resultSuccessSchema(z.object({
          token: z.string(),
        })),
        401: resultFailureSchema
      },
    },
    async handler(req, reply) {
      if (req.validationError) {
        throw new ResultError(400, "Request body does not match the required schema");
      }
      const { name, password } = req.body;
      const user = await db.user.findUnique({ where: { name }});
      if (
        req.validationError ||
        !user ||
        !user.password ||
        !await bcrypt.compare(password, user.password)
      ) {
        throw new ResultError(401, "Wrong name/password pair");
      }
      const token = fastify.jwt.sign({
        name: user.name,
        id: user.id,
      }, { expiresIn: 1_200_000 });

      return reply.send(result({ token }));
    }
  });

  fastify.decorate(
    "authorizeJWT",
    async function(
      request: FastifyRequest,
      reply: FastifyReply
    ) {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    }
  );
})