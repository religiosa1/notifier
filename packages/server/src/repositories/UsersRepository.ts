import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
import { User, UserCreate, UserDetail, UserUpdate, UserWithGroups } from "@shared/models/User";
import { and, eq, getTableColumns, inArray, isNotNull, notInArray, sql, ilike, isNull } from "drizzle-orm";
import { hash } from "src/Authorization/hash";
import { schema } from "src/db";
import { NotFoundError } from "src/error/NotFoundError";
import { inject } from "src/injection";
import { assert } from "src/util/assert";

const userNotFound = (id: string | number) => () => new NotFoundError(`user with id '${id}' doesn't exist`);

/* All of the statements using transactions can't be prepared at the moment.
 * Blocker:  https://github.com/drizzle-team/drizzle-orm/issues/613
 */

export class UsersRepository {
	private readonly dbm = inject("db");

	//============================================================================

	private queryCheckUserExists = this.dbm.prepare((db) =>  db.select({ id: schema.users.id })
		.from(schema.users)
		.where(eq(schema.users.id, sql.placeholder("id")))
		.prepare("check_user")
	);

	async assertUserExists(id: number): Promise<void> {
		const [exists] = await this.queryCheckUserExists.value.execute({ id });
		assert(exists, userNotFound(id));
	}

	private queryGetAuthorizedUserIdByTgId = this.dbm.prepare((db) => db.select({ id: schema.users.id })
		.from(schema.users)
		.where(and(
			eq(schema.users.telegramId, sql.placeholder("telegramId")),
			eq(schema.users.authorizationStatus, AuthorizationEnum.accepted)
		))
		.limit(1)
		.prepare("get_userid_by_tgid")
	);
	async getAuthorizedUserIdByTgId(telegramId: number): Promise<number | undefined> {
		const [data] = await this.queryGetAuthorizedUserIdByTgId.value.execute({ telegramId });
		return data?.id;
	}

	private readonly queryGetUserByName = this.dbm.prepare(
		(db) => db.select().from(schema.users)
			.where(eq(schema.users.name, sql.placeholder("userName")))
			.limit(1)
			.prepare("get_user_by_name")
	);
	async getUserByName(userName: string): Promise<User | undefined> {
		const [user] = await this.queryGetUserByName.value.execute({ userName });
		return user;
	}

	//============================================================================
	// LIST

	// All counts in postgres drizzle should have ::int type specifier at the end:
	// https://github.com/drizzle-team/drizzle-orm/issues/999
	private queryCountUsers = this.dbm.prepare((db) => db.select({ count: sql<number>`count(*)::int`})
		.from(schema.users)
		.prepare("count_users_query")
	);
	private queryListUsers = this.dbm.prepare((db) => db.query.users.findMany({
			limit: sql.placeholder("take"),
			offset: sql.placeholder("skip"),
			with: {
				groups: { with: { group: {
					columns: {
						id: true,
						name: true,
					}
				}}}
			}
		})
		.prepare("get_users_query")
	);

	async listUsers({ skip = 0, take = 20} = {}): Promise<[
		users: UserWithGroups[],
		totalCount: number,
	]> {
		const [
			users,
			[ { count = -1} = {}],
		] = await Promise.all([
			this.queryListUsers.value.execute({ skip, take }),
			this.queryCountUsers.value.execute(),
		]);

		return [
			users.map(user => ({
				...user,
				groups: user.groups.map(g => g.group),
			})),
			count,
		];
	}

	//============================================================================
	// GET DETAIL

	private queryGetUserDetail = this.dbm.prepare((db) => db.query.users.findFirst({
		where: (user, {eq}) => eq(user.id, sql.placeholder("userId")),
		with: { groups: { with: {
			group: {
				columns: {
					id: true,
					name: true
				}
			}
		}}}
	}).prepare("get_user_detail"));
	async getUserDetail(userId: number): Promise<UserDetail> {
		const user = await this.queryGetUserDetail.value.execute({ userId });
		assert(user, userNotFound(userId));
		return {
			...user,
			groups: user.groups.map(g => g.group),
		};
	}

	//============================================================================
	// INSERT

	/* TODO potentialle split this functionality and orchestrate it through a UserService? */
	async insertUser(user: UserCreate): Promise<UserDetail>{
		const db = this.dbm.connection;
		const password = await hash(user.password);
		const userId = await db.transaction(async (tx) => {
			const [createdUser] = await db.insert(schema.users).values({
				...user,
				password
			}).returning();
			assert(createdUser);
			if (user.groups?.length) {
				// FIXME select or insert
				const groupIds = await tx.select({ id: schema.groups.id }).from(schema.groups);
				await tx.insert(schema.usersToGroups).values(groupIds.map(g => ({
					groupId: g.id,
					userId: createdUser.id
				})));
			}
			if (user.channels?.length) {
				const allowedChannels = await tx.select({ id: schema.channels.id }).from(schema.channels)
					.innerJoin(schema.channelsToGroups, eq(schema.channelsToGroups.channelId, schema.channels.id))
					.leftJoin(schema.usersToGroups, and(
						eq(schema.usersToGroups.groupId, schema.channelsToGroups.groupId),
						eq(schema.usersToGroups.userId, createdUser.id)
					))
					.where(and(
						inArray(schema.channels.id, user.channels),
						isNotNull(schema.usersToGroups.userId)
					));
				if (allowedChannels.length) {
					await tx.insert(schema.usersToChannels).values(allowedChannels.map(c => ({
						channelId: c.id,
						userId: createdUser.id
					})));
				}
			}
			return createdUser.id;
		});

		return this.getUserDetail(userId);
	}

	//============================================================================
	// UPDATE

	async updateUser(id: number, user: UserUpdate): Promise<UserDetail> {
		const db = this.dbm.connection;
		const password = user.password ? await hash(user.password) : undefined;
		const updatedUserId = await db.transaction(async (tx) => {
			const [updatedUser] = await tx.update(schema.users)
				.set({ ...user, password, updatedAt: sql`CURRENT_TIMESTAMP`})
				.where(eq(schema.users.id, id))
				.returning();
			assert(updatedUser, userNotFound(id));
			if (user.groups?.length) {
				const groupsToUpsert = await tx.select({ id: schema.groups.id }).from(schema.groups)
					.where(inArray(schema.groups.name, user.groups )).then(groups => groups.map(i => i.id));

				if (!groupsToUpsert.length) {
					await tx.delete(schema.usersToGroups).where(eq(schema.usersToGroups.userId, id));
				} else {
					await tx.delete(schema.usersToGroups).where(and(
						eq(schema.usersToGroups.userId, id),
						notInArray(schema.usersToGroups.groupId, groupsToUpsert)
					));
					await tx.insert(schema.usersToGroups).values(
						groupsToUpsert.map(g => ({ userId: id, groupId: g}))
					).onConflictDoNothing();
				}
			}
			if (user.channels?.length) {
				const channelsToUpsert = await tx.select({ id: schema.channels.id }).from(schema.channels)
					.where(inArray(schema.channels.id, user.channels )).then(groups => groups.map(i => i.id));
				if (!channelsToUpsert.length) {
					await tx.delete(schema.usersToChannels).where(eq(schema.usersToChannels.userId, id));
				} else {
					await tx.delete(schema.usersToChannels).where(and(
						eq(schema.usersToChannels.userId, id),
						notInArray(schema.usersToChannels.channelId, channelsToUpsert)
					));
					await tx.insert(schema.usersToChannels).values(
						channelsToUpsert.map(c => ({ userId: id, channelId: c }))
					);
				}
			}
			return updatedUser.id;
		});
		return this.getUserDetail(updatedUserId);
	}

	//============================================================================
	// DELETE

	async deleteUsers(ids: number[]): Promise<number> {
		if (!ids.length) {
			return 0;
		}
		const db = this.dbm.connection;
		const data = await db.delete(schema.users).where(inArray(schema.users.id, ids));
		return data.count;
	}

	//============================================================================
	// SEARCH

	private querySearchUsers = this.dbm.prepare((db) => db.select().from(schema.users)
		.where(ilike(schema.users.name, sql.placeholder("name")))
		.prepare("search_users")
	);

	// TODO 2 separate queries -- one with group, one without
	private querySearchUsersForGroup = this.dbm.prepare((db) => db.select(
		getTableColumns(schema.users)
	).from(schema.users)
		.leftJoin(schema.usersToGroups, and(
			eq(schema.usersToGroups.userId, schema.users.id),
			eq(schema.usersToGroups.groupId, sql.placeholder("groupId"))
		))
		.where(and(
			ilike(schema.users.name, sql.placeholder("name")),
			isNull(schema.usersToGroups.groupId)
		))
		.prepare("search_users_for_group")
	);
	async searchUsers({ name = "", groupId }: { name?: string, groupId?: number} = {}): Promise<User[]> {
		if (groupId) {
			return this.querySearchUsersForGroup.value.execute({ groupId, name: "%" + name + "%"});
		}
		return this.querySearchUsers.value.execute({ name: "%" + name + "%" });
	}
}