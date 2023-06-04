import type { DbTransactionClient } from "src/db";
import type { UserCreate, UserUpdate, UserDetail } from "@shared/models/User";
import { userDetailSchema } from "@shared/models/User";
import { omit } from "@shared/helpers/omit";
import { hash } from 'src/Authorization/hash';

export async function getUser(tx: DbTransactionClient, userId: number): Promise<UserDetail>  {
	const user = await tx.user.findUniqueOrThrow({
		where: { id: userId },
		include: { groups: { select: { id: true, name: true }}}
	});
	return userDetailSchema.parse(user);
}

export async function userExistsByTgId(tx: DbTransactionClient, telegramId: number): Promise<boolean> {
	return tx.user.findUniqueOrThrow({
		select: { id: true },
		where: { telegramId },
	}).then(r => !!r?.id );
}

export async function getUserIdByTgId(tx: DbTransactionClient, telegramId: number): Promise<number> {
	return tx.user.findUniqueOrThrow({
		select: { id: true },
		where: { telegramId },
	}).then(r => r.id );
}

export async function createUser(tx: DbTransactionClient, user: UserCreate) {
	const password = await hash(user.password);
	return tx.user.create({
		data: {
			...omit(user, ["channels", "groups", "password"]),
			password,
			groups: nameArrayToUpsert(user.groups)
		},
		include: {
			groups: { select: { id: true, name: true }},
		}
	})
}

export async function editUser(tx: DbTransactionClient, id: number, user: UserUpdate) {
	const password = await hash(user.password);
	return tx.user.update({
		where: { id },
		data: {
			...omit(user, ["channels", "groups", "password"]),
			password,
			groups: nameArrayToUpsert(user.groups),
		},
		include: {
			groups: { select: { id: true, name: true }},
		}
	})
}

export async function deleteUsers(tx: DbTransactionClient, ids: number[]): Promise<number> {
	if (!ids?.length) {
		return 0;
	}
	const { count } = await tx.user.deleteMany({
			where: { id: { in: ids } }
	});
	return count;
}

function nameArrayToUpsert(arr: string[] | undefined | null) {
	if (!arr || !Array.isArray(arr)) {
		return;
	}
	return {
		connectOrCreate: arr.filter(i => i && typeof i === "string").map((name) => {
			return {
				where: { name },
				create: { name },
			}
		}),
	};
}