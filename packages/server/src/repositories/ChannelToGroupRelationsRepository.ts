import { and, eq, inArray, sql } from "drizzle-orm";
import { schema } from "src/db";
import { inject } from "src/injection";
import { assert } from "src/util/assert";

export class ChannelToGroupRelationsRepository {
	private readonly dbm = inject("db");

	//============================================================================
	// CONNECT

	async connectOrCreateGroupToChannel(channelId: number, groupName: string): Promise<void> {
		const db = this.dbm.connection;
		await db.transaction(async (tx) => {
			const [group] = await tx.insert(schema.groups).values({ name: groupName})
				.onConflictDoNothing()
				.returning({ id: schema.groups.id });
			assert(group);

			await tx.insert(schema.channelsToGroups).values({
				channelId,
				groupId: group.id
			});
		});
	}

	// CONNECT channel to group
	async connectOrCreateChannelToGroup(groupId: number, channelName: string): Promise<void> {
		const db = this.dbm.connection;
		await db.transaction(async (tx) => {
			const [channel] = await tx.insert(schema.channels).values({ name: channelName })
				.onConflictDoNothing()
				.returning({ id: schema.channels.id });
			assert(channel);
			await tx.insert(schema.channelsToGroups).values({
				channelId: channel.id,
				groupId,
			});
		});
	}

	//============================================================================
	// DELETE

	private readonly queryDeleteGroupsFromChannelByIds = this.dbm.prepare(
		(db) => db.delete(schema.channelsToGroups)
			.where(and(
				eq(schema.channelsToGroups.channelId, sql.placeholder("channelId")),
				inArray(schema.channelsToGroups.groupId, sql.placeholder("groupIds"))
			))
			.returning({ count: sql<number>`count(*)::int` })
			.prepare("delete_channel_groups")
	);

	async deleteGroupsFromChannelByIds(channelId: number, groupIds: number[]): Promise<number> {
		if (!groupIds?.length) {
			return 0;
		}
		const [{count = -1} = {}] = await this.queryDeleteGroupsFromChannelByIds.value.execute({ channelId, groupIds });
		return count;
	}

	private readonly queryDeleteAllGroupsFromChannel = this.dbm.prepare(
		(db) => db.delete(schema.channelsToGroups)
			.where(eq(schema.channelsToGroups.channelId, sql.placeholder("channelId")))
			.returning({ count: sql<number>`count(*)::int` })
			.prepare("delete_all_channel_groups")
	);
	async deleteAllGroupsFromChannel(channelId: number): Promise<number> {
		const [{count = -1} = {}] = await this.queryDeleteAllGroupsFromChannel.value.execute({ channelId });
		return count;
	}

	// DELETE channel from group

	private readonly queryDeleteChannelsFromGroupByIds = this.dbm.prepare(
		(db) => db.delete(schema.channelsToGroups)
			.where(and(
				eq(schema.channelsToGroups.groupId, sql.placeholder("groupId")),
				inArray(schema.channelsToGroups.channelId, sql.placeholder("channelIds")),
			))
			.returning({ count: sql<number>`count(*)::int` })
			.prepare("delete_channels_from_group_by_ids")
	);

	async deleteChannelsFromGroupByIds(groupId: number, channelIds: number[]): Promise<number> {
		if (!channelIds?.length) {
			return 0;
		}
		const [{count = -1} = {}] = await this.queryDeleteChannelsFromGroupByIds.value.execute({ groupId, channelIds });
		return count;
	}

	private readonly queryDeleteAllChannelsFromGroup = this.dbm.prepare(
		(db) => db.delete(schema.channelsToGroups)
			.where(eq(schema.channelsToGroups.groupId, sql.placeholder("groupId")))
			.returning({ count: sql<number>`count(*)::int` })
			.prepare("delete_all_channels_from_group")
	);
	async deleteAllChannelsFromGroup(groupId: number): Promise<number> {
		const [{count = -1} = {}] = await this.queryDeleteAllChannelsFromGroup.value.execute({ groupId });
		return count;
	}
}