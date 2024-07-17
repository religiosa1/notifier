import { withIsolatedAppEnv } from "src/__tests__/withIsolatedAppEnv";
import { di } from "src/injection";
import { schema } from "src/db";
import { describe, test, expect } from "vitest";
import { eq } from "drizzle-orm";

describe("/users/:userId/groups route", () => {
	async function createGroup(name: string) {
		const groupRepo = di.inject("GroupsRepository");
		const { id } = await groupRepo.insertGroup(name);
		return id;
	}

	async function listUserGroups(userId: number) {
		const db = di.inject("db");
		const groups = await db.connection
			.select({
				id: schema.usersToGroups.groupId,
				name: schema.groups.name,
			})
			.from(schema.usersToGroups)
			.leftJoin(schema.groups, eq(schema.groups.id, schema.usersToGroups.groupId))
			.where(eq(schema.usersToGroups.userId, userId));
		return groups;
	}
	// There's no GET method on this endpoint, as this data is always retrieved from GET /user/:id

	describe("POST /users/:userId/groups", () => {

	
		test("creates and connects a group", withIsolatedAppEnv(async (app, headers) => {
			expect((await listUserGroups(1)).find(i => i.name === "test")).toBeUndefined();
			const res = await app.request("/users/1/groups", {
				method: "POST",
				headers,
				body: JSON.stringify({ name: "test" })
			});
			expect(res.status).toBe(201);
			expect((await listUserGroups(1)).find(i => i.name === "test")).toBeDefined();
		}));
		test("connects an existing group", withIsolatedAppEnv(async (app, headers) => {
			await createGroup("test");
			expect((await listUserGroups(1)).find(i => i.name === "test")).toBeUndefined();
			const res = await app.request("/users/1/groups", {
				method: "POST",
				headers,
				body: JSON.stringify({ name: "test" })
			});
			expect(res.status).toBe(200);
			expect((await listUserGroups(1)).find(i => i.name === "test")).toBeDefined();
		}));
		test("returns 404 on non-existing user", withIsolatedAppEnv(async (app, headers) => {
			await createGroup("test");
			const res = await app.request("/users/100500/groups", {
				method: "POST",
				headers,
				body: JSON.stringify({ name: "test" })
			});
			expect(res.status).toBe(404);
		}));
	});
});