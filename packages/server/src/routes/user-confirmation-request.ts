import fp from "fastify-plugin";
import z from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { result, resultSuccessSchema } from "@shared/models/Result";
import { paginationSchema, paginationDefaults } from "@shared/models/Pagination";
import * as UserModel from "@shared/models/User";
import { counted } from "@shared/models/Counted";
import { parseIds, batchIdsSchema } from "@shared/models/batchIds";
import { batchOperationStatsSchema } from "@shared/models/BatchOperationStats";
import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
import { inject } from "src/injection";
import { eq, inArray, sql } from "drizzle-orm";
import { schema } from "src/db";

export default fp(async function (fastify) {
	const dbm = inject("db");

	const usersCountQuery = dbm.prepare((db) =>
		db.select({ count: sql<number>`count(*)::int` }).from(schema.users)
			.where(eq(schema.users.authorizationStatus, AuthorizationEnum.pending))
			.prepare("users_count_query")
	);
	const usersQuery = dbm.prepare((db) => db.query.users.findMany({
			offset: sql.placeholder("skip"),
			limit: sql.placeholder("take"),
			where: (user, {eq}) => eq(user.authorizationStatus, AuthorizationEnum.pending),
			with: {
				groups: {
					with: {
						group: {
							columns: {
								id: true,
								name: true,
							}
						}
					}
				},
			}
		}).prepare("users_query")
	);

	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "GET",
		url: "/user-confirmation-request",
		schema: {
			querystring: paginationSchema,
			response: {
				200: resultSuccessSchema(counted(z.array(UserModel.userWithGroupsSchema))),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const { skip, take } = { ...paginationDefaults, ...req.query };

			const [
				[{ count = -1 } = {} ],
				users
			] = await Promise.all([
				usersCountQuery.value.execute(),
				usersQuery.value.execute({ skip, take }),
			]);

			return reply.send(result({
				count,
				data: users.map(user => ({
					...user,
					groups: user.groups.map(groups => groups.group)
				})) satisfies UserModel.UserWithGroups[]
			}));
		}
	});


	const deleteQuery = dbm.prepare(db => db.update(schema.users)
		.set({ authorizationStatus: AuthorizationEnum.declined, updatedAt: sql`CURRENT_TIMESTAMP` })
		.where(inArray(schema.users.id, sql.placeholder("ids")))
		.returning({ count: sql<number>`count(*)` })
		.prepare("delete_query")
	);
	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "DELETE",
		url: "/user-confirmation-request",
		schema: {
			querystring: z.object({ id: batchIdsSchema }),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {
			const ids = parseIds(req.query.id);

			const [{ count = -1 } = {}] = await deleteQuery.value.execute({ ids });

			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`User batch deny by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});


	const acceptQuery = dbm.prepare(db => db.update(schema.users)
		.set({ authorizationStatus: AuthorizationEnum.accepted, updatedAt: sql`CURRENT_TIMESTAMP` })
		.returning({ count: sql<number>`count(*)::int` })
		.prepare("accept_query")
	);
	fastify.withTypeProvider<ZodTypeProvider>().route({
		method: "PUT",
		url: "/user-confirmation-request",
		schema: {
			querystring: z.object({ id: batchIdsSchema }),
			response: {
				200: resultSuccessSchema(batchOperationStatsSchema),
			}
		},
		onRequest: fastify.authorizeJWT,
		async handler(req, reply) {

			const ids = parseIds(req.query.id);
			const [{ count = -1 } = {}] = await acceptQuery.value.execute({ ids });

			const data = {
				count,
				outOf: ids.length,
			};
			fastify.log.info(`User batch deny by ${req.user.id}-${req.user.name}`, data);
			return reply.send(result(data));
		}
	});
});