import { and, eq, inArray, sql, count } from "drizzle-orm";
import { schema } from "src/db";
import { NotFoundError } from "src/error/NotFoundError";
import { di } from "src/injection";

import { assert } from "src/util/assert";
export class UserToGroupRelationsRepository {
	private readonly dbm = di.inject("db");

	//============================================================================
	// DELETE users from group

	// orphaned user-to-channel relations handled by a db trigger

	async deleteUserFromGroup(groupId: number, userIds?: number[]): Promise<number> {
		const db = this.dbm.connection;
		if (userIds && !userIds.length) {
			return 0;
		}
		return db.transaction(async (tx) => {
			const whereClauses = [ eq(schema.usersToGroups.groupId, groupId) ];
			if (userIds) {
				whereClauses.push(inArray(schema.usersToGroups.userId, userIds));
			}
			// orphaned user-to-channel relations handled by a db trigger
			const [{value = -1} = {}] = await tx.delete(schema.usersToGroups)
				.where(and(...whereClauses))
				.returning({ value: count() });
			return value;
		}, { behavior: "immediate" });
	}

	// DELETE group from user
	private readonly queryDeleteGroupFromUser = this.dbm.prepare((db) =>
		db.delete(schema.usersToGroups)
			.where(and(
				eq(schema.usersToGroups.userId, sql.placeholder("userId")),
				eq(schema.usersToGroups.groupId, sql.placeholder("groupId")),
			))
			.returning()
			.prepare()
	);

	async deleteGroupFromUser(userId: number, groupId: number): Promise<void> {
		await Promise.all([ this.assertUserExists(userId), this.assertGroupExists(groupId)]);
		const data  = await this.queryDeleteGroupFromUser.value.execute({ userId, groupId });
		assert(data.length, `Failed to delete group id = ${groupId} from user id = '${userId}'`);
	}

	async deleteAllGroupsFromUser(userId: number): Promise<void> {
		await this.assertUserExists(userId);
		const db = this.dbm.connection;
		await db.delete(schema.usersToGroups).where(eq(schema.usersToGroups.userId, userId));
	}

	//============================================================================
	// CONNECT user to group
	async connectUserToGroup(groupId: number, userName: string): Promise<void> {
		const db = this.dbm.connection;		
		await this.assertGroupExists(groupId); 
		await db.transaction(async (tx) => {
			const user = await tx.query.users.findFirst({
				where: eq(schema.users.name, userName)
			});
			assert(user, () => new NotFoundError(`user with name '${userName}' doesn't exist`));
			db.insert(schema.usersToGroups).values({ groupId, userId: user.id });
		});
	}

	// CONNECT group to user
	async connectGroupToUser(userId: number, groupName: string): Promise<[groupId: number, created: boolean]> {
		const db = this.dbm.connection;
		await this.assertUserExists(userId);
		let isNewGroupCreated = false;
		const groupId = await db.transaction(async (tx) => {
			let [{ groupId = null } = {}] = await tx.select({ groupId: schema.groups.id }).from(schema.groups)
				.where(eq(schema.groups.name, groupName));
			if (!groupId) {
				isNewGroupCreated = true;
				[{ groupId = null } = {}] = await tx.insert(schema.groups).values({ name: groupName })
					.returning({ groupId: schema.groups.id });
			}
			assert(groupId);
			const result = await tx.insert(schema.usersToGroups).values({ userId, groupId });
			return Number(result.lastInsertRowid);
		}, { behavior: "immediate" });
		return [groupId, isNewGroupCreated];
	}

	//===========================================================================
	// Helpers	
	private readonly checkUserId = this.dbm.prepare(
		(db) => db.select({ id: schema.users.id }).from(schema.users)
			.where(eq(schema.users.id, sql.placeholder("userId")))
			.prepare()
	);
	private async assertUserExists(userId: number): Promise<void> {		
		const result = await this.checkUserId.value.execute({ userId });
		if (!result.length) {
			throw new NotFoundError(`User ID=${userId} doesn't exist`);
		}
	}

	private readonly checkGroupId = this.dbm.prepare(
		(db) => db.select({ id: schema.users.id }).from(schema.users)
			.where(eq(schema.users.id, sql.placeholder("groupId")))
			.prepare()
	);
	private async assertGroupExists(groupId: number ): Promise<void> {
		const result = await this.checkGroupId.value.execute({ groupId });
		if (!result.length) {
			throw new NotFoundError(`Group "ID"=${groupId} doesn't exist`);
		}
	}
}