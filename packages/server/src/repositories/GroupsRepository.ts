import type { Group, GroupDetail } from "@shared/models/Group";
import { and, eq, getTableColumns, ilike, inArray, isNull, sql } from "drizzle-orm";
import { schema } from "src/db";
import { NotFoundError } from "src/error/NotFoundError";
import { di } from "src/injection";

import { assert } from "src/util/assert";

const groupNotFound = (id: string | number) => () => new NotFoundError(`group with id '${id}' doesn't exist`);

export class GroupsRepository {
	private readonly dbm = di.inject("db");

	//============================================================================

	private readonly queryCheckGroupExists = this.dbm.prepare((db) =>  db.select({ id: schema.groups.id })
		.from(schema.groups)
		.where(eq(schema.groups.id, sql.placeholder("groupId")))
		.prepare("check_group")
	);

	async assertGroupExists(groupId: number) {
		const [exists] = await this.queryCheckGroupExists.value.execute({ groupId });
		assert(exists, groupNotFound(groupId));
	}

	//============================================================================
	// LIST

	private readonly queryCountGroups = this.dbm.prepare((db) => db.select({ count: sql<number>`count(*)::int`})
		.from(schema.groups)
		.prepare("count_groups")
	);

	private readonly querListGroups = this.dbm.prepare((db) => db.select({
			...getTableColumns(schema.groups),
			channelsCount: sql<number>`count(${schema.channelsToGroups.channelId})::int`,
			usersCount: sql<number>`count(${schema.usersToGroups.userId})::int`
		}).from(schema.groups)
			.leftJoin(schema.channelsToGroups, eq(schema.channelsToGroups.groupId, schema.groups.id))
			.leftJoin(schema.usersToGroups, eq(schema.usersToGroups.groupId, schema.groups.id))
			.groupBy(schema.groups.id)
		.prepare("list_groups")
	);

	async listGroups({ skip = 0, take = 20 } = {}): Promise<[
		groups: Array<Group & { channelsCount: number, usersCount: number }>,
		totalCount: number,
	]> {
		const [
			groups,
			[{count = -1} = {}],
		] = await Promise.all([
			this.querListGroups.value.execute({ skip, take }),
			this.queryCountGroups.value.execute(),
		]);
		return [ groups, count ];
	}

	//============================================================================
	// PREVIEW

	private readonly queryGetGroupPreview = this.dbm.prepare((db) => db.query.groups.findFirst({
		where: eq(schema.groups.id, sql.placeholder("groupId"))
	}).prepare("get_group_preview"));

	async getGroupPreview(groupId: number): Promise<Group> {
		const group = await this.queryGetGroupPreview.value.execute({ groupId });
		assert(group, groupNotFound(groupId));
		return group;
	}

	//============================================================================
	// DETAIL

	private readonly queryGetGroupDetail = this.dbm.prepare((db) => db.query.groups.findFirst({
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

	//============================================================================
	// UPDATE

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

	//============================================================================
	// INSERT

	private readonly queryInsertGroup = this.dbm.prepare((db) => db.insert(schema.groups)
		.values({ name: sql.placeholder("name") })
		.returning({ id: schema.groups.id })
		.prepare("insert_group")
	);

	async insertGroup(name: string): Promise<{ id: number }> {
		const [group] = await this.queryInsertGroup.value.execute({ name });
		assert(group, `Failed to create the group "${name}"`);
		return group;
	}

	//============================================================================
	// DELETE

	async deleteGroups(ids: number[]): Promise<number> {
		if (!ids?.length) {
			return 0;
		}
		const db = this.dbm.connection;
		// orphaned user-to-channel relations handled by a db trigger
		const {count} = await db.delete(schema.groups)
			.where(inArray(schema.groups.id, ids));

		return count;
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
}