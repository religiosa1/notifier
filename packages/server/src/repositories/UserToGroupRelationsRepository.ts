import { and, eq, inArray, sql } from "drizzle-orm";
import { schema } from "src/db";
import { NotFoundError } from "src/error/NotFoundError";
import { inject } from "src/injection";
import { assert } from "src/util/assert";
export class UserToGroupRelationsRepository {
	private readonly dbm = inject("db");

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
			const [{count = -1} = {}] = await tx.delete(schema.usersToGroups)
				.where(and(...whereClauses))
				.returning({ count: sql<number>`count(*)::int` });
			return count;
		});
	}

	// DELETE group from user
	private readonly queryDeleteGroupFromUser = this.dbm.prepare((db) =>
		db.delete(schema.usersToGroups)
			.where(and(
				eq(schema.usersToGroups.userId, sql.placeholder("userId")),
				eq(schema.usersToGroups.groupId, sql.placeholder("groupId")),
			))
			.returning()
			.prepare("delete_group_from_user")
	);

	async deleteGroupFromUser(userId: number, groupId: number): Promise<void> {
		const data  = await this.queryDeleteGroupFromUser.value.execute({ userId, groupId });
		assert(data, `Failed to delete group id = ${groupId} from user id = '${userId}'`);
	}

	async deleteAllGroupsFromUser(userId: number): Promise<void> {
		const db = this.dbm.connection;
		await db.delete(schema.usersToGroups).where(eq(schema.usersToGroups.userId, userId));
	}

	//============================================================================
	// CONNECT user to group
	async connectUserToGroup(groupId: number, userName: string): Promise<void> {
		const db = this.dbm.connection;
		await db.transaction(async (tx) => {
			const user = await tx.query.users.findFirst({
				where: eq(schema.users.name, userName)
			});
			assert(user, () => new NotFoundError(`user with name '${userName}' doesn't exist`));
			tx.insert(schema.usersToGroups).values({
				groupId,
				userId: user.id
			});
		});
	}

	// CONNECT group to user
	async connectGroupToUser(userId: number, groupName: string): Promise<void> {
		const db = this.dbm.connection;
		await db.transaction(async (tx) => {
			let [group] = await tx.select({ id: schema.groups.id }).from(schema.groups)
				.where(eq(schema.groups.name, groupName));
			if (!group) {
				await tx.insert(schema.groups).values({ name: groupName })
					.returning({ id: schema.groups.id });
			}
			assert(group);
			await tx.insert(schema.usersToGroups).values({
				userId,
				groupId: group?.id
			});
		});
	}
}