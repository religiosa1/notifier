import type { Channel, ChannelSubscription } from "@shared/models/Channel";
import { eq, and, inArray, sql, getTableColumns } from "drizzle-orm";
import { WithSubqueryWithSelection } from "drizzle-orm/pg-core";
import { schema, type DbTransactionClient } from "src/db";
import { inject } from "src/injection";
import { assert } from "src/util/assert";

export type BatchPayload = {
	count: number
}

export async function getUserChannels(
	userId: number,
	{
		skip = 0,
		take = 20,
	} = {},
	tx: DbTransactionClient = inject("db").connection
): Promise<[data: Channel[], total: number]> {
	const userChannels = tx.$with("user_channels").as(
		tx.select().from(schema.channels)
			.innerJoin(schema.usersToChannels, eq(schema.channels.id, schema.usersToChannels.channelId))
			.orderBy(schema.channels.id)
			.where(eq(schema.usersToChannels.userId, userId))
	);

	const [ channels, [ {count = -1} = {} ]] = await Promise.all([
		tx.selectDistinct(getTableColumns(schema.channels)).from(userChannels).limit(take).offset(skip),
		tx.select({ count: sql<number>`COUNT(DISTINCT ${schema.channels.id})::int` }).from(userChannels),
	]);
	return [channels, count];
}

export async function availableUnsubscribedChannels(
	userId: number,
	tx: DbTransactionClient = inject("db").connection
): Promise<Channel[]> {
	const data = await tx.select(getTableColumns(schema.channels))
		.from(schema.channels)
		.innerJoin(schema.channelsToGroups, eq(schema.channelsToGroups.channelId, schema.channels.id))
		.innerJoin(schema.groups, eq(schema.channelsToGroups.groupId, schema.groups.id))
		.innerJoin(schema.usersToGroups, eq(schema.usersToGroups.groupId, schema.groups.id))
		.leftJoin(schema.usersToChannels, and(
			eq(schema.usersToChannels.userId, schema.usersToGroups.userId),
			eq(schema.usersToChannels.channelId, schema.channels.id)
		))
		.where(and(
			eq(schema.usersToGroups.userId, userId),
		))
		.groupBy(schema.channels.id)
		.having(sql`COUNT(${schema.usersToChannels.channelId}) > 0`)

	return data;
}

/** Get a list of all channels available to user, with their subscription status for the user */
export async function allAvailableChannels(
	userId: number,
	tx: DbTransactionClient = inject("db").connection
): Promise<ChannelSubscription[]> {
	const data = await tx.select({
		id: schema.channels.id,
		name: schema.channels.name,
		subscribed: sql<boolean>`COUNT(${schema.usersToChannels.channelId}) <> 0`,
	}).from(schema.channels)
		.innerJoin(schema.channelsToGroups, eq(schema.channelsToGroups.channelId, schema.channels.id))
		.innerJoin(schema.groups, eq(schema.channelsToGroups.groupId, schema.groups.id))
		.innerJoin(schema.usersToGroups, eq(schema.usersToGroups.groupId, schema.groups.id))
		.leftJoin(schema.usersToChannels, and(
			eq(schema.usersToChannels.userId, schema.usersToGroups.userId),
			eq(schema.usersToChannels.channelId, schema.channels.id)
		))
		.where(and(
			eq(schema.usersToGroups.userId, userId),
		))
		.groupBy(schema.channels.id);

	// TODO
	console.log("allAvailableChannels, check that subscribed is really boolean!", data);
	return data;
}

export async function connectUserChannel(
	userId: number,
	channelId: number,
	tx: DbTransactionClient = inject("db").connection
): Promise<{ id: number, userId: number, channelId: number }> {
	const [permisionGroup] = await tx.select({ id: schema.groups.id }).from(schema.groups)
		.innerJoin(schema.channelsToGroups, and(
			eq(schema.channelsToGroups.groupId, schema.groups.id),
			eq(schema.channelsToGroups.channelId, channelId)
		))
		.innerJoin(schema.usersToGroups, and(
			eq(schema.usersToGroups.groupId, schema.groups.id),
			eq(schema.usersToGroups.userId, userId),
		))
		.limit(1);

	if (!permisionGroup) {
		throw new Error("The user doesn't have the required permissions to join the channel");
	}
	const [userChannel] = await tx.insert(schema.usersToChannels).values({ userId, channelId }).returning();
	assert(userChannel);
	return userChannel;
}

export async function disconnectUserChannels(
	userId: number,
	channelIds: number[],
	tx: DbTransactionClient = inject("db").connection
): Promise<BatchPayload> {
	if (!userId || !channelIds?.length) {
		return { count: 0 };
	}

	const rowsToDelete = tx.$with("rows_to_delete").as(tx.select({ id: schema.usersToChannels.id })
		.from(schema.usersToChannels)
		.where(and(
			eq(schema.usersToChannels.userId, userId),
			inArray(schema.usersToChannels.userId, channelIds),
		))
	);

	return deleteUserChannelsWith(rowsToDelete, tx);
}

/** Removing all of the UserChannels, to which users don't have access. */
export async function removeRestricredChannels(tx: DbTransactionClient = inject("db").connection): Promise<BatchPayload> {
	const orphanedSq = tx.$with("orphaned").as(
		tx.select({id: schema.usersToChannels.id}).from(schema.usersToChannels)
			.innerJoin(schema.channels, eq(schema.channels.id, schema.usersToChannels.channelId))
			.innerJoin(schema.users, eq(schema.users.id, schema.usersToChannels.userId))
			.leftJoin(schema.channelsToGroups, eq(schema.channelsToGroups.channelId, schema.channels.id))
			.leftJoin(schema.groups, eq(schema.groups.id, schema.channelsToGroups.groupId))
			.leftJoin(schema.usersToGroups, and(
				eq(schema.users.id, schema.usersToGroups.userId),
				eq(schema.groups.id, schema.usersToGroups.groupId),
			))
	);

	return deleteUserChannelsWith(orphanedSq, tx);
}

type RowsToDeleteWith = WithSubqueryWithSelection<{
	id: typeof schema.usersToChannels.id,
}, string>;

async function deleteUserChannelsWith(
	rowsToDelete: RowsToDeleteWith,
	tx: DbTransactionClient = inject("db").connection
): Promise<BatchPayload> {
	const [{count = -1} = {}] = await tx.delete(schema.usersToChannels)
		.where(inArray(schema.usersToChannels.id, rowsToDelete))
		.returning({ count: sql<number>`count(*)::int`})
	return { count };
}
