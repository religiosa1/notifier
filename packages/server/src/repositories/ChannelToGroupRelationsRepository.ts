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
			let [group] = await tx.select({ id: schema.groups.id }).from(schema.groups)
				.where(eq(schema.groups.name, groupName));
			if (!group) {
				[group] = await tx.insert(schema.groups).values({ name: groupName})
					.returning({ id: schema.groups.id });
			}
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
			let [channel] = await tx.select({ id: schema.channels.id }).from(schema.channels)
				.where(eq(schema.channels.name, channelName));
			if (!channel) {
				[channel] = await tx.insert(schema.channels).values({ name: channelName })
					.returning({ id: schema.channels.id });
			}
			assert(channel);
			await tx.insert(schema.channelsToGroups).values({
				channelId: channel.id,
				groupId,
			});
		});
	}

	//============================================================================
	// DICONNECT

	async disconnectGroupsFromChannelByIds(channelId: number, groupIds: number[]): Promise<number> {
		if (!groupIds?.length) {
			return 0;
		}
		const db = this.dbm.connection;
		const data = await db.delete(schema.channelsToGroups)
			.where(and(
				eq(schema.channelsToGroups.channelId, channelId),
				inArray(schema.channelsToGroups.groupId, groupIds)
			))
			.returning();
		return data.length;
	}

	private readonly queryDisconnectAllGroupsFromChannel = this.dbm.prepare(
		(db) => db.delete(schema.channelsToGroups)
			.where(eq(schema.channelsToGroups.channelId, sql.placeholder("channelId")))
			.returning()
			.prepare("delete_all_channel_groups")
	);
	async disconnectAllGroupsFromChannel(channelId: number): Promise<number> {
		const data = await this.queryDisconnectAllGroupsFromChannel.value.execute({ channelId });
		return data.length;
	}

	// DELETE channel from group

	async deleteChannelsFromGroupByIds(groupId: number, channelIds: number[]): Promise<number> {
		if (!channelIds?.length) {
			return 0;
		}
		const db = this.dbm.connection;
		const data = await db.delete(schema.channelsToGroups)
			.where(and(
				eq(schema.channelsToGroups.groupId, groupId),
				inArray(schema.channelsToGroups.channelId, channelIds),
			))
			.returning();
		return data.length;
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