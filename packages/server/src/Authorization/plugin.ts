import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import bcrypt from "bcrypt";
import { ResultError, resultFailureSchema, resultSuccessSchema, result } from "@shared/models/Result";
import { UserRoleEnum } from "@shared/models/UserRoleEnum";
import { tokenPayloadSchema } from "@shared/models/TokenPayload";
import { authorizeKey } from "src/Authorization/authorizeKey";
import { inject } from "src/injection";

export default fp(async function (fastify) {
	const usersRepository = inject("UsersRepository");
	// TODO This needs to be reworked, to support our settings service
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
					token: z.string()
				})),
				401: resultFailureSchema
			},
		},
		async handler(req, reply) {
			if (req.validationError) {
				throw new ResultError(400, "Request body does not match the required schema");
			}
			const { name, password } = req.body;
			const user = await usersRepository.getUserByName(name);
			if (
				req.validationError ||
				!user?.password ||
				!await bcrypt.compare(password, user.password)
			) {
				throw new ResultError(401, "Wrong name/password pair");
			}
			if (user.role !== UserRoleEnum.admin) {
				throw new ResultError(403, "You don't have required permissions");
			}
			const payload = tokenPayloadSchema.omit({ iat: true, exp: true }).parse(user);
			const token = fastify.jwt.sign(payload, { expiresIn: 1_200_000 });

			return reply.send(result({ token, user }));
		}
	});

	fastify.decorate(
		"authorizeJWT",
		async function (
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

	// Not actually used anywhere, do we even need it?
	fastify.decorate(
		"authorizeKey",
		authorizeKey.bind(fastify, fastify),
	);

	fastify.decorate(
		"authorizeAnyMethod",
		async function (
			request: FastifyRequest,
			reply: FastifyReply,
		) {
			return request.jwtVerify().catch(() => authorizeKey(fastify, request, reply));
		}
	);
})