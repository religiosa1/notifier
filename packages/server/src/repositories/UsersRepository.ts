import { AuthorizationEnum } from "@shared/models/AuthorizationEnum";
import { UserRoleEnum } from "@shared/models/UserRoleEnum";
import type { User, UserCreate, UserDetail, UserUpdate, UserWithGroups } from "@shared/models/User";
import { and, eq, getTableColumns, inArray, isNotNull, sql, like, isNull, count } from "drizzle-orm";
import { hashPassword } from "src/services/hash";
import { schema, type Transaction } from "src/db";
import { NotFoundError } from "src/error/NotFoundError";
import { di } from "src/injection";

import { assert } from "src/util/assert";

const userNotFound = (id: string | number) => () => new NotFoundError(`user with id '${id}' doesn't exist`);

/* All of the statements using transactions can't be prepared at the moment.
 * Blocker: https://github.com/drizzle-team/drizzle-orm/issues/613
 */

export class UsersRepository {
	private readonly dbm = di.inject("db");

	//============================================================================

	private queryCheckUserExists = this.dbm.prepare((db) =>  db.select({ id: schema.users.id })
		.from(schema.users)
		.where(eq(schema.users.id, sql.placeholder("id")))
		.prepare()
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
		.prepare()
	);
	async getAuthorizedUserIdByTgId(telegramId: number): Promise<number | undefined> {
		const [data] = await this.queryGetAuthorizedUserIdByTgId.value.execute({ telegramId });
		return data?.id;
	}

	private readonly queryGetUserByName = this.dbm.prepare(
		(db) => db.select().from(schema.users)
			.where(eq(schema.users.name, sql.placeholder("userName")))
			.limit(1)
			.prepare()
	);
	async getUserByName(userName: string): Promise<User | undefined> {
		const [user] = await this.queryGetUserByName.value.execute({ userName });
		return user;
	}

	//============================================================================
	// LIST

	private queryCountUsers = this.dbm.prepare((db) => db.select({ count: count() })
		.from(schema.users)
		.prepare()
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
		.prepare()
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

	private queryGetNotifiableAdminChatIds = this.dbm.prepare(
		(db) => db.select({ telegramId: schema.users.telegramId })
			.from(schema.users)
			.where(eq(schema.users.role, UserRoleEnum.admin))
			.prepare()
	);
	async getNotifiableAdminsChatIds(): Promise<number[]> {
		const data = await this.queryGetNotifiableAdminChatIds.value.execute();
		// TODO ability to turn notifications on and off
		return data.map(i => i.telegramId);
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
	}).prepare());
	async getUserDetail(userId: number): Promise<UserDetail> {
		const user = await this.queryGetUserDetail.value.execute({ userId });
		assert(user, userNotFound(userId));
		return {
			...user,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
			groups: user.groups.map(g => g.group),
		};
	}

	//============================================================================
	// INSERT

	/* TODO potentialle split this functionality and orchestrate it through a UserService? */
	async insertUser(user: UserCreate): Promise<UserDetail>{
		const db = this.dbm.connection;
		const password = await hashPassword(user.password);
		const userId = await db.transaction(async (tx) => {
			const [createdUser] = await db.insert(schema.users).values({
				...user,
				password,
				createdAt: new Date(),
				updatedAt: new Date(),
			}).returning();
			assert(createdUser);
			if (user.groups?.length) {
				await this.setUserGroups(tx, createdUser.id, user.groups) !== user.groups.length;
			}
			if (user.channels?.length) {
				await this.setUserChannels(tx, createdUser.id, user.channels);
			}
			return createdUser.id;
		}, { behavior: "immediate" });

		return this.getUserDetail(userId);
	}

	//============================================================================
	// UPDATE

	async updateUser(id: number, user: UserUpdate): Promise<UserDetail> {
		const db = this.dbm.connection;
		const password = user.password ? await hashPassword(user.password) : undefined;
		const updatedUserId = await db.transaction(async (tx) => {
			const [updatedUser] = await tx.update(schema.users)
				.set({ ...user, password, updatedAt: new Date() })
				.where(eq(schema.users.id, id))
				.returning();
			assert(updatedUser, userNotFound(id));
			if (user.groups != null) {
				await this.setUserGroups(tx, updatedUser.id, user.groups);
			}
			if (user.channels != null) {
				await this.setUserChannels(tx, updatedUser.id, user.channels);
			}
			return updatedUser.id;
		}, { behavior: "immediate" });

		return this.getUserDetail(updatedUserId);
	}

	//============================================================================
	// DELETE

	async deleteUsers(ids: number[]): Promise<number> {
		if (!ids.length) {
			return 0;
		}
		const db = this.dbm.connection;
		const {changes} = await db.delete(schema.users).where(inArray(schema.users.id, ids));
		return changes;
	}

	//============================================================================
	// SEARCH

	private querySearchUsers = this.dbm.prepare((db) => db.select().from(schema.users)
		.where(like(schema.users.name, sql.placeholder("name")))
		.prepare()
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
			like(schema.users.name, sql.placeholder("name")),
			isNull(schema.usersToGroups.groupId)
		))
		.prepare()
	);
	async searchUsers({ name = "", groupId }: { name?: string, groupId?: number} = {}): Promise<User[]> {
		if (groupId) {
			return this.querySearchUsersForGroup.value.execute({ groupId, name: "%" + name + "%"});
		}
		return this.querySearchUsers.value.execute({ name: "%" + name + "%" });
	}

	//============================================================================
	// Helpers

	private async setUserGroups(tx: Transaction, userId: number, groupIds: number[]): Promise<number> {
		// Removing existing user groups first
		await tx.delete(schema.usersToGroups).where(eq(schema.usersToGroups.userId, userId));

		if (!groupIds?.length) {
			return 0
		}

		const groupsToUpsert = await tx.select({ id: schema.groups.id }).from(schema.groups)
			.where(inArray(schema.groups.id, groupIds ));

		if (!groupsToUpsert.length) {
			return 0;
		}
		await tx.insert(schema.usersToGroups).values(groupsToUpsert.map(g => ({ userId, groupId: g.id })));

		return groupsToUpsert.length;
	}

	private async setUserChannels(tx: Transaction, userId: number, channels: number[]): Promise<number> {
		await tx.delete(schema.usersToChannels).where(eq(schema.usersToChannels.userId, userId));

		if (!channels?.length) {
			return 0;
		}

		const allowedChannels = await tx.select({ id: schema.channels.id }).from(schema.channels)
			.innerJoin(schema.channelsToGroups, eq(schema.channelsToGroups.channelId, schema.channels.id))
			.leftJoin(schema.usersToGroups, and(
				eq(schema.usersToGroups.groupId, schema.channelsToGroups.groupId),
				eq(schema.usersToGroups.userId, userId)
			))
			.where(and(
				inArray(schema.channels.id, channels),
				isNotNull(schema.usersToGroups.userId)
			));
		
		if (!allowedChannels.length) {
			return 0;
		}

		await tx.insert(schema.usersToChannels).values(allowedChannels.map(c => ({
			channelId: c.id,
			userId
		})));
		return allowedChannels.length;
	}
}