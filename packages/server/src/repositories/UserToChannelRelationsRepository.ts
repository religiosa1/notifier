import { Channel, ChannelSubscription } from "@shared/models/Channel";
import { and, eq, getTableColumns, inArray, sql } from "drizzle-orm";
import { schema } from "src/db";
import { inject } from "src/injection";

export class UserToChannelRelationsRepository {
	private readonly dbm = inject("db");

	//============================================================================
	// LIST

	private readonly queryCountUserChannels = this.dbm.prepare(
		(db) => db.select({ count: sql<number>`count(*)::int`}).from(schema.usersToChannels)
			.where(eq(schema.usersToChannels.userId, sql.placeholder("userId")))
			.prepare("count_user_channels")
	);
	private readonly queryListUserChannels = this.dbm.prepare(
		(db) => db.select(getTableColumns(schema.channels)).from(schema.channels)
			.innerJoin(schema.usersToChannels, eq(schema.usersToChannels.channelId, schema.channels.id))
			.where(eq(schema.usersToChannels.userId, sql.placeholder("userId")))
			.orderBy(schema.channels.name, schema.channels.id)
			.limit(sql.placeholder("take"))
			.offset(sql.placeholder("skip"))
	);

	async listUserChannels(
		userId: number,
		{
			skip = 0,
			take = 20,
		} = {},
	): Promise<[channels: Channel[], totalCount: number]> {
		const [
			[{count = -1} = {}],
			channels
		] = await Promise.all([
			this.queryCountUserChannels.value.execute({ userId }),
			this.queryListUserChannels.value.execute({ userId, skip, take })
		]);
		return [ channels, count ];
	}

	// LIST available unsubscribed channels for user
	// TODO: totalCount
	private readonly queryListAvailableUnsubscribedChannelsForUser = this.dbm.prepare(
		(db) => db.select(getTableColumns(schema.channels)).from(schema.channels)
			.innerJoin(schema.channelsToGroups, eq(schema.channelsToGroups.channelId, schema.channels.id))
			.innerJoin(schema.usersToGroups, eq(schema.usersToGroups.groupId, schema.channelsToGroups.groupId))
			.leftJoin(schema.usersToChannels, and(
				eq(schema.usersToChannels.userId, schema.usersToGroups.userId),
				eq(schema.usersToChannels.channelId, schema.channels.id)
			))
			.where(eq(schema.usersToGroups.userId, sql.placeholder("userId")))
			.groupBy(schema.channels.id)
			.having(sql`COUNT(${schema.usersToChannels.channelId}) = 0`)
			.orderBy(schema.channels.name, schema.channels.id)
			.limit(sql.placeholder("take"))
			.offset(sql.placeholder("skip"))
			.prepare("list_user_available_unsubscribed_channels")
	);
	async listAvailableUnsubscribedChannelsForUser(userId: number, { skip = 0, take = 20} = {}): Promise<Channel[]> {
		return this.queryListAvailableUnsubscribedChannelsForUser.value.execute({ userId, skip, take });
	}

	// LIST all available channels for user

	private readonly queryCountAllAvailableChannelsForUser = this.dbm.prepare(
		(db) => db.select({ count: sql<number>`count(distinct ${schema.channels.id})::int`})
			.from(schema.channels)
			.innerJoin(schema.channelsToGroups, eq(schema.channelsToGroups.channelId, schema.channels.id))
			.innerJoin(schema.usersToGroups, and(
				eq(schema.usersToGroups.groupId, schema.channelsToGroups.groupId),
				eq(schema.usersToGroups.userId, sql.placeholder("userId"))
			))
			.leftJoin(schema.usersToChannels, and(
				eq(schema.usersToChannels.userId, schema.usersToGroups.userId),
				eq(schema.usersToChannels.channelId, schema.channels.id),
			))
			.prepare("query_count_all_available_channels_for_user")
	);

	private readonly queryListAllAvailableChannelsForUser = this.dbm.prepare(
		(db) => db.select({
			id: schema.channels.id,
			name: schema.channels.name,
			subscribed: sql<boolean>`COUNT(${schema.usersToChannels.channelId}) > 0`,
		}).from(schema.channels)
			.innerJoin(schema.channelsToGroups, eq(schema.channelsToGroups.channelId, schema.channels.id))
			.innerJoin(schema.usersToGroups, and(
				eq(schema.usersToGroups.groupId, schema.channelsToGroups.groupId),
				eq(schema.usersToGroups.userId, sql.placeholder("userId"))
			))
			.leftJoin(schema.usersToChannels, and(
				eq(schema.usersToChannels.userId, schema.usersToGroups.userId),
				eq(schema.usersToChannels.channelId, schema.channels.id),
			))
			.groupBy(schema.channels.id)
			.orderBy(schema.channels.name, schema.channels.id)
			.limit(sql.placeholder("take"))
			.offset(sql.placeholder("skip"))
			.prepare("list_all_available_channels_for_user")
	);
	async listAllAvailableChannelsForUser(userId: number, { skip = 0, take = 20 } = {}): Promise<[
		channels: ChannelSubscription[],
		totalCount: number,
	]> {
		const [
			channels,
			[{count = -1} = {}]
		] = await Promise.all([
			this.queryListAllAvailableChannelsForUser.value.execute({ userId, skip, take }),
			this.queryCountAllAvailableChannelsForUser.value.execute({ userId }),
		]);
		return [ channels, count ];
	}

	//============================================================================
	// CONNECT
	private queryGetPermissionGroup = this.dbm.prepare(
		(db) => db.select({ id: schema.groups.id }).from(schema.groups)
			.innerJoin(schema.channelsToGroups, and(
				eq(schema.channelsToGroups.groupId, schema.groups.id),
				eq(schema.channelsToGroups.channelId, sql.placeholder("channelId"))
			))
			.innerJoin(schema.usersToGroups, and(
				eq(schema.usersToGroups.groupId, schema.groups.id),
				eq(schema.usersToGroups.userId, sql.placeholder("userId")),
			))
			.limit(1)
			.prepare("get_permission_group")
	);

	async connectUserChannel(userId: number, channelId: number): Promise<void> {
		const db = this.dbm.connection;
		const [permisionGroup] = await this.queryGetPermissionGroup.value.execute({ userId, channelId});
		if (!permisionGroup) {
			throw new Error("The user doesn't have the required permissions to join the channel");
		}
		await db.insert(schema.usersToChannels).values({ userId, channelId }).returning();
	};

	//============================================================================
	// DISCONNECT

	async disconnectUserChannels(userId: number, channelIds: number[]): Promise<number> {
		if (!channelIds?.length) {
			return 0;
		}
		const db = this.dbm.connection;
		console.table({ userId, channelIds });
		const {count} = await db.delete(schema.usersToChannels)
			.where(and(
				eq(schema.usersToChannels.userId, userId),
				inArray(schema.usersToChannels.channelId, channelIds)
			));
		return count;
	}
}