import { Channel, ChannelDetail } from "@shared/models/Channel";
import { ResultError } from "@shared/models/Result";
import { getTableColumns, sql, eq, ilike, isNull, and, inArray } from "drizzle-orm";
import { schema } from "src/db";
import { inject } from "src/injection";
import { assert } from "src/util/assert";

const channelNotFound = (id: number) => () => new ResultError(404, `channel with id = '${id}' cannot be dound`);

export class ChannelsRepository {
	private readonly dbm = inject("db");

	//============================================================================

	private readonly queryGetChannelId = this.dbm.prepare(
		(db) => db.query.channels.findFirst({
			columns: {
				id: true
			},
			where: ( channel, { eq }) => eq(channel.name, sql.placeholder("name"))
		}).prepare("get_channel_id")
	);
	async getChannelId(name: string): Promise<number | undefined> {
		const { id } = await this.queryGetChannelId.value.execute({ name }) ?? {};
		return id;
	}

	private readonly queryAssertChannelExists = this.dbm.prepare((db) =>
		db.select({ id: schema.channels.id }).from(schema.channels)
			.where(eq(schema.channels.id, sql.placeholder("channelId")))
			.prepare("check_channel")
	);
	async assertChannelExist(channelId: number): Promise<void> {
		const [channel] = await this.queryAssertChannelExists.value.execute({ channelId });
		assert(channel, channelNotFound(channelId));
	}

	//============================================================================
	// LIST

	private readonly queryCountChannels = this.dbm.prepare((db) => db.select({ count: sql<number>`count(*)::int` })
		.from(schema.channels)
		.prepare("count_channels_query")
	);
	private readonly queryListChannels = this.dbm.prepare((db) => db.select({
		...getTableColumns(schema.channels),
		usersCount: sql<number>`COUNT(${schema.usersToChannels.userId})::int`,
		groupsCount: sql<number>`COUNT(${schema.channelsToGroups.groupId})::int`,
	}).from(schema.channels)
		.innerJoin(schema.usersToChannels, eq(schema.usersToChannels.channelId, schema.channels.id))
		.innerJoin(schema.channelsToGroups, eq(schema.channelsToGroups.channelId, schema.channels.id))
		.groupBy(schema.channels.id)
		.limit(sql.placeholder("take"))
		.offset(sql.placeholder("skip"))
		.prepare("channels_query")
	);

	async listChannels({ skip = 0, take = 20} = {}): Promise<{
			count: number;
			channels: Array<Channel & {
				usersCount: number;
				groupsCount: number;
			}>
	}> {
		const [
			[{ count = -1} = {}],
			channels
		] = await Promise.all([
			this.queryCountChannels.value.execute(),
			this.queryListChannels.value.execute({ skip, take})
		]);
		return {
			count,
			channels
		}
	}

	//============================================================================
	// GET DETAIL

	private readonly queryGetChannelDetail = this.dbm.prepare((db) =>
		db.query.channels.findFirst({
			where: eq(schema.channels.id, sql.placeholder("channelId")),
			with: {
				groups: {
					with: {
						group: true
					}
				}
			}
		})
		.prepare("get_channel_detail")
	);
	async getChannelDetail(channelId: number): Promise<ChannelDetail> {
		const channelDetail = await this.queryGetChannelDetail.value.execute({ channelId });
		assert(channelDetail, channelNotFound(channelId));
		return {
			...channelDetail,
			groups: channelDetail.groups.map(g => g.group),
		};
	}

	//============================================================================
	// INSERT

	private readonly queryInsertChannel = this.dbm.prepare((db) => db.insert(schema.channels)
		.values({ name: sql.placeholder("name")})
		.returning()
		.prepare("insert_channel")
	);
	async insertChannel(name: string): Promise<Channel>{
		const [channel] = await this.queryInsertChannel.value.execute({ name });
		assert(channel, () => new ResultError(409, `channel with name = '${name}', could not be created`));
		return channel;
	}

	//============================================================================
	// UPDATE

	async updateChannel(channelId: number, name: string): Promise<Channel> {
		const db = this.dbm.connection;
		const [channel] = await db.update(schema.channels)
			.set({ name, updatedAt: sql`CURRENT_TIMESTAMP` })
			.where(eq(schema.channels.id, channelId))
			.returning();
		assert(channel, channelNotFound(channelId));
		return channel;
	}

	//============================================================================
	// DELETE

	private readonly queryDeleteChannels = this.dbm.prepare((db) => db.delete(schema.channels)
		.where(inArray(schema.channels.id, sql.placeholder("ids")))
		.returning({ count: sql<number>`count(*)::int` })
		.prepare("delete_channels")
	);
	async deleteChannels(ids: number[]): Promise<number> {
		if (!ids?.length) {
			return 0;
		}
		const [{count = -1} = {}] = await this.queryDeleteChannels.value.execute({ ids });
		return count;
	}

	//============================================================================
	// SEARCH

	private readonly querySearchChannels = this.dbm.prepare((db) => db.select()
		.from(schema.channels)
		.where(ilike(schema.channels.name, sql.placeholder("name")))
		.prepare("search_channel")
	);
	async searchChannels({ name = ""}): Promise<Channel[]> {
		return this.querySearchChannels.value.execute({ name });
	}

	private readonly querySearchChannelsForGroup = this.dbm.prepare((db) =>
		db.select(getTableColumns(schema.channels)).from(schema.channels)
			.leftJoin(schema.channelsToGroups, and(
				eq(schema.channelsToGroups.channelId, schema.channels.id),
				eq(schema.channelsToGroups.groupId, sql.placeholder("group"))
			))
			.where(and(
				ilike(schema.channels.name, sql.placeholder("name")),
				isNull(schema.channelsToGroups.groupId)
			))
			.prepare("channel_search_query_for_group")
	);
	async searchChannelsForGroup({ name = "", groupId }: { name: string, groupId: number}): Promise<Channel[]> {
		return this.querySearchChannelsForGroup.value.execute({ name, groupId });
	}
}