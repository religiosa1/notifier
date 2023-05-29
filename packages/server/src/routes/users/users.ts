import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { db } from "src/db";
import { omit } from "src/helpers/omit";
import { result, resultFailureSchema, resultSuccessSchema } from "src/models/Result";
import { paginationSchema, paginationDefaults } from "src/models/Pagination";
import * as UserModel from "src/models/User";
import { counted } from "src/models/Counted";
import { parseIds, batchIdsSchema } from "src/models/batchIds";
import { batchOperationStatsSchema } from "src/models/BatchOperationStats";
import { hash } from 'src/Authorization/hash';
import { handlerDbNotFound } from "src/error/handlerRecordNotFound";
import { handlerUniqueViolation } from "src/error/handlerUniqueViolation";
import { userChannels } from "./userChannels";
import { userGroups } from "./userGroups";
import { userKeys } from "./userKeys";

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
				userId: z.number({ coerce: true}).int().gt(0),
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
				include: { groups: { select: { id: true, name: true }}}
			}).catch(handlerDbNotFound(userNotFound(id))) as UserModel.UserDetail;
			return reply.send(result(user));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "POST",
		url: "/users/:userId",
		schema: {
			params: z.object({
				userId: z.number({ coerce: true}).int().gt(0),
			}),
			body: UserModel.userUpdateSchema,
			response: {
				200: resultSuccessSchema(UserModel.userDetailSchema),
				404: resultFailureSchema,
				409: resultFailureSchema,
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
					groups: nameArrayToUpsert(req.body.groups),
				},
				include: {
					groups: { select: { id: true, name: true }},
				}
			})
				.catch(handlerDbNotFound(userNotFound(id)))
				.catch(handlerUniqueViolation()) as UserModel.UserDetail;
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
				409: resultFailureSchema,
			},
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const user = await db.user.create({
				data: {
					...omit(req.body, ["channels", "groups", "password"]),
					password: await hash(req.body.password),
					groups: nameArrayToUpsert(req.body.groups)
				},
				include: {
					groups: { select: { id: true, name: true }},
				}
			}).catch(handlerUniqueViolation()) as UserModel.UserDetail;
			fastify.log.info(`User create by ${req.user.id}-${req.user.name}`, req.body);
			return reply.send(result(user));
		}
	});

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/users/:userId",
		schema: {
			params: z.object({
				userId: z.number({ coerce: true}).int().gt(0),
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
			fastify.log.info(`User ${req.params.userId} delete by ${req.user.id}-${req.user.name}`, user);
			return reply.send(result(null));
		}
	});


	userChannels(fastify);
	userGroups(fastify);
	userKeys(fastify);
});

function nameArrayToUpsert(arr: string[] | undefined | null) {
	if (!arr || !Array.isArray(arr)) {
		return;
	}
	return {
		connectOrCreate: arr.filter(i => i && typeof i === "string").map((name) => {
			return {
				where: { name },
				create: { name },
			}
		}),
	};
}
