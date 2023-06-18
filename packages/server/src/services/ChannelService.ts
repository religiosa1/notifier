import type { DbTransactionClient } from "src/db";

export async function getChannelId(tx: DbTransactionClient, name: string): Promise<number | undefined> {
	return tx.channel.findUnique({
		select: { id: true },
		where: { name },
	}).then(r => r?.id);
}