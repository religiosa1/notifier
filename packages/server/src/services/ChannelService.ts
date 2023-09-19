import type { DbTransactionClient } from "src/db";
import { inject } from "src/injection";

export async function getChannelId(
	name: string,
	tx: DbTransactionClient = inject("db").connection
): Promise<number | undefined> {
	return tx.query.channels.findFirst({
		columns: {
			id: true
		},
		where: ( channel, { eq }) => eq(channel.name, name)
	}).then(r => r?.id);
}