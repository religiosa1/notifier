import { and, eq, inArray, sql } from "drizzle-orm";
import { schema } from "src/db";
import { inject } from "src/injection";
import { assert } from "src/util/assert";

export class ChannelToGroupRelationRepository {
	private readonly dbm = inject("db");

	//============================================================================
	// INSERT

	async connectOrCreateChannelGroup(channelId: number, groupName: string) {
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

	//============================================================================
	// DELETE

	private readonly queryDeleteChannelGroupsByIds = this.dbm.prepare(
		(db) => db.delete(schema.channelsToGroups)
			.where(and(
				eq(schema.channelsToGroups.channelId, sql.placeholder("channelId")),
				inArray(schema.channelsToGroups.groupId, sql.placeholder("groupIds"))
			))
			.returning({ count: sql<number>`count(*)::int` })
			.prepare("delete_channel_groups")
	);

	async deleteChannelGroupsByIds(channelId: number, groupIds: number[]): Promise<number> {
		if (!groupIds?.length) {
			return 0;
		}
		const [{count = -1} = {}] = await this.queryDeleteChannelGroupsByIds.value.execute({ channelId, groupIds });
		return count;
	}

	private readonly queryDeleteAllChannelGroups = this.dbm.prepare(
		(db) => db.delete(schema.channelsToGroups)
			.where(eq(schema.channelsToGroups.channelId, sql.placeholder("channelId")))
			.returning({ count: sql<number>`count(*)::int` })
			.prepare("delete_all_channel_groups")
	);
	async deleteAllChannelGroups(channelId: number): Promise<number> {
		const [{count = -1} = {}] = await this.queryDeleteAllChannelGroups.value.execute({ channelId });
		return count;
	}
}