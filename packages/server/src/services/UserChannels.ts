import type { Channel, UserChannel } from "@prisma/client";
import type { ChannelSubscription } from "@shared/models/Channel";
import type { DbTransactionClient } from "src/db";

export type BatchPayload = {
	count: number
}

export function getUserChannels(
	tx: DbTransactionClient,
	userId: number,
	{
		skip,
		take
	} = {
			skip: 0,
			take: 20,
		}
): Promise<[data: Channel[], total: number]> {
	return Promise.all([
		tx.channel.findMany({
			skip,
			take,
			where: {
				userChannels: { some: { userId } }
			}
		}),
		tx.userChannel.count({
			where: { userId }
		}),
	] as const);
}

export function availableChannels(
	tx: DbTransactionClient,
	userId: number
): Promise<Channel[]> {
	return tx.channel.findMany({
		where: {
			Groups: { some: { Users: { some: { id: userId } } } },
			userChannels: { none: { userId } },
		}
	});
}

export async function allAvailableChannels(
	tx: DbTransactionClient,
	userId: number
): Promise<ChannelSubscription[]> {
	const data = await tx.channel.findMany({
		include: { userChannels: true },
		where: {
			Groups: { some: { Users: { some: { id: userId } } } },
		},
	});
	return data.map(i => ({
		id: i.id,
		name: i.name,
		subscribed: i.userChannels.length > 0,
	}));
}


export async function connectUserChannel(
	tx: DbTransactionClient,
	userId: number,
	channelId: number
): Promise<UserChannel> {
	const perms = await tx.channel.findFirst({
		where: {
			id: channelId,
			Groups: { some: {
				Users: { some: { id: userId}}
			}}
		},
	});
	if (perms == null) {
		throw new Error("The user doesn't have the required permissions to join the channel");
	}
	return tx.userChannel.create({ data: { userId, channelId } });
}

export function disconnectUserChannels(
	tx: DbTransactionClient,
	userId: number,
	channelIds: number[],
): Promise<BatchPayload> {
	return tx.userChannel.deleteMany({
		where: {
			userId,
			channelId: { in: channelIds }
		}
	});
}

/** Removing all of the UserChannels, to which users don't have access. */
export function removeRestricredChannels(tx: DbTransactionClient): Promise<number> {
	// I can't manage to do this effectively in Prisma, so here goes some raw sql.
	return tx.$executeRaw`
		WITH orphaned AS (
			SELECT UserChannel.channelId, UserChannel.userId FROM UserChannel
			JOIN Channel ON UserChannel.channelId = Channel.id
			JOIN User ON UserChannel.userId = User.id
			LEFT JOIN _ChannelToGroup ON Channel.id = _ChannelToGroup.A
			LEFT JOIN [Group] ON _ChannelToGroup.B = [Group].id
			LEFT JOIN _GroupToUser ON _GroupToUser.B = User.id AND [Group].id = _GroupToUser.A
			WHERE _GroupToUser.B is NULL
		)
		DELETE FROM UserChannel WHERE
			userId IN (SELECT userId FROM orphaned)
			AND
			channelId IN (SELECT channelId FROM orphaned)
	`;
}