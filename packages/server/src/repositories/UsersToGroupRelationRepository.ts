import { Group, GroupDetail } from "@shared/models/Group";
import { and, eq, getTableColumns, ilike, inArray, isNull, sql } from "drizzle-orm";
import { schema } from "src/db";
import { NotFoundError } from "src/error/NotFoundError";
import { inject } from "src/injection";
import { removeRestricredChannels } from "src/services/UserChannels";
import { assert } from "src/util/assert";

const groupNotFound = (id: string | number) => () => new NotFoundError(`group with id '${id}' doesn't exist`);

export class UsersToGroupRelationRepository {
	private readonly dbm = inject("db");
	private groupsRepository = inject("GroupsRepository");

	//============================================================================
	// DELETE users from group
	async deleteGroupUsers(groupId: number, userIds?: number[]): Promise<number> {
		const db = this.dbm.connection;
		if (userIds && !userIds.length) {
			return 0;
		}
		return db.transaction(async (tx) => {
			await this.groupsRepository.assertGroupExists(groupId);
			const whereClauses = [ eq(schema.usersToGroups.groupId, groupId) ];
			if (userIds) {
				whereClauses.push(inArray(schema.usersToGroups.userId, userIds));
			}
			const [{count = -1} = {}] = await tx.delete(schema.usersToGroups)
				.where(and(...whereClauses))
				.returning({ count: sql<number>`count(*)::int` });
			await removeRestricredChannels(tx);
			return count;
		});
	}

	async connectGroupUser(groupId: number, userName: string): Promise<void> {
		const db = this.dbm.connection;
		await db.transaction(async (tx) => {
			await this.groupsRepository.assertGroupExists(groupId);
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
	//============================================================================

	private queryCountGroups = this.dbm.prepare((db) => db.select({ count: sql<number>`count(*)::int`})
		.from(schema.groups)
		.prepare("count_groups")
	);

	private queryGetGroupsPreview = this.dbm.prepare((db) => db.select({
			...getTableColumns(schema.groups),
			channelsCount: sql<number>`count(${schema.channelsToGroups.channelId})::int`,
			usersCount: sql<number>`count(${schema.usersToGroups.userId})::int`
		}).from(schema.groups)
			.leftJoin(schema.channelsToGroups, eq(schema.channelsToGroups.groupId, schema.groups.id))
			.leftJoin(schema.usersToGroups, eq(schema.usersToGroups.groupId, schema.groups.id))
			.groupBy(schema.groups.id)
		.prepare("get_groups_preview")
	);

	async getGroupsPreview({ skip = 0, take = 20 } = {}): Promise<{
		groups: Array<Group & { channelsCount: number, usersCount: number }>
		count: number;
	}> {
		const [
			[{count = -1} = {}],
			groups
		] = await Promise.all([
			this.queryCountGroups.value.execute(),
			this.queryGetGroupsPreview.value.execute({ skip, take }),
		]);
		return {
			groups,
			count
		}
	}

	//============================================================================

	private queryGetGroupPreview = this.dbm.prepare((db) => db.query.groups.findFirst({
		where: eq(schema.groups.id, sql.placeholder("groupId"))
	}).prepare("get_group_preview"));

	async getGroupPreview(groupId: number): Promise<Group> {
		const group = await this.queryGetGroupPreview.value.execute({ groupId });
		assert(group, groupNotFound(groupId));
		return group;
	}

	//============================================================================
	// CREATE

	private queryCreateGroup = this.dbm.prepare((db) => db.insert(schema.groups)
		.values({ name: sql.placeholder("name") })
		.returning({ id: schema.groups.id })
		.prepare("create_group")
	);

	async createGroup(name: string): Promise<{ id: number }> {
		const [group] = await this.queryCreateGroup.value.execute({ name });
		assert(group, `Failed to create the group "${name}"`);
		return group;
	}

	//============================================================================
	// DELETE
	private deleteGroupsQuery = this.dbm.prepare((db) => db.delete(schema.groups)
		.where(inArray(schema.groups.id, sql.placeholder("ids")))
		.returning({ count: sql<number>`count(*)::int` })
		.prepare("delete_group_query")
	);

	async deleteGroups(ids: number[]): Promise<number> {
		if (!ids?.length) {
			return 0;
		}
		const db = this.dbm.connection;
		return await db.transaction(async (tx) => {
			const [{ count = -1} = {}] = await this.deleteGroupsQuery.value.execute({ids});
			await removeRestricredChannels(tx);
			return count;
		});
	}

	//============================================================================
	// SEARCH

	async searchAvailableGroups({ name = "", channelId, userId}: {
		name?: string,
		channelId?: number,
		userId?: number
	}) {
		const db = this.dbm.connection;

		const groupsQuery = db.select(getTableColumns(schema.groups)).from(schema.groups);
		const whereClasues = [
			ilike(schema.groups.name, "%" + name + "%"),
		];

		if (channelId) {
			groupsQuery.leftJoin(schema.channelsToGroups, and(
				eq(schema.channelsToGroups.groupId, schema.groups.id),
				eq(schema.channelsToGroups.channelId, channelId)
			));
			whereClasues.push(isNull(schema.channelsToGroups.groupId));
		}

		if (userId) {
			groupsQuery.innerJoin(schema.usersToGroups, and(
				eq(schema.usersToGroups.groupId, schema.groups.id),
				eq(schema.usersToGroups.userId, userId)
			));
			whereClasues.push(isNull(schema.usersToGroups.groupId));
		}
		groupsQuery.where(and(...whereClasues));
		return groupsQuery;
	}

	//============================================================================

	private queryGetGroupDetail = this.dbm.prepare((db) => db.query.groups.findFirst({
		where: eq(schema.groups.id, sql.placeholder("groupId")),
		with: {
			channels: { with: { channel: {
				columns: {
					id: true,
					name: true,
				}
			}}},
			users: { with: { user: {
				columns: {
					id: true,
					name: true
				}
			}}}
		}
	}).prepare("get_group_detail"))

	async getGroupDetail(groupId: number): Promise<GroupDetail> {
		const group = await this.queryGetGroupDetail.value.execute({ groupId });
		assert(group, groupNotFound(groupId));
		return {
			...group,
			users: group.users.map(i => i.user),
			channels: group.channels.map(i => i.channel)
		};
	}

	async updateGroup(id: number, name: string): Promise<Group> {
		const db = this.dbm.connection;
		const [group] = await db.update(schema.groups).set({
			name,
			updatedAt: sql`CURRENT_TIMESTAMP`
		})
			.where(eq(schema.groups.id, id))
			.returning();
		assert(group, groupNotFound(id));
		return group;
	}
}