import { and, eq, inArray, sql } from "drizzle-orm";
import { schema } from "src/db";
import { di } from "src/injection";

import { assert } from "src/util/assert";

export class ChannelToGroupRelationsRepository {
	private readonly dbm = di.inject("db");

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
		}, { behavior: "immediate" });
	}

	// CONNECT channel to group
	async connectOrCreateChannelToGroup(groupId: number, channelName: string): Promise<[ channelId: number, created: boolean]> {
		const db = this.dbm.connection;
		let isNewChannelCreated = false;
		const channelId = await db.transaction(async (tx) => {
			let [channel] = await tx.select({ id: schema.channels.id }).from(schema.channels)
				.where(eq(schema.channels.name, channelName));
			if (!channel) {
				[channel] = await tx.insert(schema.channels)
					.values({ 
						name: channelName,
						createdAt: new Date(), 
						updatedAt: new Date() 
					})
					.returning({ id: schema.channels.id });
				isNewChannelCreated = true;
			}
			assert(channel);
			await tx.insert(schema.channelsToGroups).values({
				channelId: channel.id,
				groupId,
			});
			return channel.id;
		}, { behavior: "immediate" });
		return [channelId, isNewChannelCreated];
	}

	//============================================================================
	// DICONNECT

	async disconnectGroupsFromChannelByIds(channelId: number, groupIds: number[]): Promise<number> {
		if (!groupIds?.length) {
			return 0;
		}
		const db = this.dbm.connection;
		const {changes} = await db.delete(schema.channelsToGroups)
			.where(and(
				eq(schema.channelsToGroups.channelId, channelId),
				inArray(schema.channelsToGroups.groupId, groupIds)
			));
		return changes;
	}

	private readonly queryDisconnectAllGroupsFromChannel = this.dbm.prepare(
		(db) => db.delete(schema.channelsToGroups)
			.where(eq(schema.channelsToGroups.channelId, sql.placeholder("channelId")))
			.prepare()
	);
	async disconnectAllGroupsFromChannel(channelId: number): Promise<number> {
		const {changes} = await this.queryDisconnectAllGroupsFromChannel.value.execute({ channelId });
		return changes;
	}

	// DELETE channel from group

	async deleteChannelsFromGroupByIds(groupId: number, channelIds: number[]): Promise<number> {
		if (!channelIds?.length) {
			return 0;
		}
		const db = this.dbm.connection;
		const {changes} = await db.delete(schema.channelsToGroups)
			.where(and(
				eq(schema.channelsToGroups.groupId, groupId),
				inArray(schema.channelsToGroups.channelId, channelIds),
			));
		return changes;
	}

	private readonly queryDeleteAllChannelsFromGroup = this.dbm.prepare(
		(db) => db.delete(schema.channelsToGroups)
			.where(eq(schema.channelsToGroups.groupId, sql.placeholder("groupId")))
			.prepare()
	);
	async deleteAllChannelsFromGroup(groupId: number): Promise<number> {
		const {changes} = await this.queryDeleteAllChannelsFromGroup.value.execute({ groupId });
		return changes;
	}
}