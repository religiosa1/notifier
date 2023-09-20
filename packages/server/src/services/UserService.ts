import type { UserCreate, UserUpdate, UserDetail, User } from "@shared/models/User";
import { hash } from 'src/Authorization/hash';
import { schema, type DbTransactionClient } from "src/db";
import { inject } from "src/injection";
import { assert } from "src/util/assert";
import { eq, inArray, sql } from "drizzle-orm";

export async function getUser(
	userId: number,
	tx: DbTransactionClient = inject("db").connection
): Promise<UserDetail> {
	const user = await tx.query.users.findFirst({
		where: (user, {eq}) => eq(user.id, userId),
		with: { groups: { with: {
			group: {
				columns: {
					id: true,
					name: true
				}
			}
		}}}
	});
	assert(user);
	return {
		...user,
		groups: user.groups.map(g => g.group),
	};
}

export async function getUserIdByTgId(
	telegramId: number,
	tx: DbTransactionClient = inject("db").connection
): Promise<number | undefined> {
	return tx.query.users.findFirst({
		columns: { id: true },
		where: (user, {eq}) => eq(user.telegramId, telegramId),
	}).then(r => r?.id);
}

export async function createUser(
	user: UserCreate,
	tx: DbTransactionClient = inject("db").connection
): Promise<UserDetail>{
	const password = await hash(user.password);
	const [createdUser] = await tx.insert(schema.users).values({
		...user,
		password
	}).returning();
	assert(createdUser);
	if (user.groups?.length) {
		const groups = await tx.insert(schema.groups).values(
			user.groups.map(i => ({ name: i }))
		).returning();

		tx.insert(schema.usersToGroups).values(groups.map(g => ({
			groupId: g.id,
			userId: createdUser.id
		})));
	}
	if (user.groups?.length) {
		// TODO create channels checking permissions
	}
	return getUser(createdUser.id);
}

export async function editUser(id: number, user: UserUpdate, tx: DbTransactionClient = inject("db").connection) {
	const password = user.password ? await hash(user.password) : undefined;
	const [updatedUser] = await tx.update(schema.users)
		.set({ ...user, password })
		.where(eq(schema.users.id, id))
		.returning();
	assert(updatedUser);
	// TODO upsert groups
	return {
		...updatedUser,
		groups: [],
	};
}

export async function deleteUsers(ids: number[], tx: DbTransactionClient = inject("db").connection): Promise<number> {
	if (!ids?.length) {
		return 0;
	}
	const [{ count = -1} = {}] = await tx.delete(schema.users)
		.where(inArray(schema.users.id, ids))
		.returning({ count: sql<number>`count(*)::int`})
	return count;
}