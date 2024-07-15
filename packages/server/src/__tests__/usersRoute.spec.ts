import { describe, test, expect } from "vitest";
import { withIsolatedAppEnv } from "src/__tests__/withIsolatedAppEnv";
import { AuthorizationEnum, type UserCreate } from "@shared/models";
import { UserRoleEnum } from "@shared/models/UserRoleEnum";
import { di } from "src/injection";
import { schema } from "src/db";
import { sql } from "drizzle-orm";

describe("users route", () => {
	const testUser: UserCreate = {
		telegramId: 654321,
		name: "John Doe",
	};

	test("GET /users", withIsolatedAppEnv(async (app, headers) => {
		const res = await app.request("/users", { headers });
		const body: any = await res.json();
		expect(res.status).toBe(200);
		expect(body.data.count).toBe(1);
		expect(body.data.data[0].name).toBe("admin");
	}));

	test("GET /users/:ID", withIsolatedAppEnv(async (app, headers) => {
		const res = await app.request("/users/1", { headers });
		const body: any = await res.json();
		expect(res.status).toBe(200);
		expect(body.data.name).toBe("admin");
	}));

	test.todo("GET /search");

	test("POST /users", withIsolatedAppEnv(async (app, headers) => {
		const res = await app.request("/users", {
			method: "POST",
			headers,
			body: JSON.stringify(testUser)
		});
		expect(res.status).toBe(200);

		const getRes = await app.request("/users/2", { headers })
		const body: any = await getRes.json();

		expect(body.data.name).toBe(testUser.name);
		expect(body.data.telegramId).toBe(testUser.telegramId);
		expect(body.data.password).toBe(null);
		expect(body.data.role).toBe(UserRoleEnum.regular);
		expect(body.data.authorizationStatus).toBe(AuthorizationEnum.pending);
		expect(body.data.createdAt).toBeTypeOf("string");
		expect(body.data.updatedAt).toBeTypeOf("string");
	}));

	test("PUT /users/:ID", withIsolatedAppEnv(async (app, headers) => {
		const db = di.inject("db");
		const result = await db.connection.insert(schema.users).values(testUser);
		const url = `/users/${result.lastInsertRowid}`;

		const res = await app.request(url, {
			method: "PUT",
			headers,
			body: JSON.stringify({ ...testUser, name: "Jane Doe" })
		});
		expect(res.status).toBe(200);

		const getRes = await app.request(url, { headers });
		const body: any = await getRes.json();

		expect(body.data.name).toBe("Jane Doe");
		expect(body.data.createdAt).not.toBe(body.data.updatedAt);
	}));

	test("DELETE /users/:ID", withIsolatedAppEnv(async (app, headers) => {
		const db = di.inject("db");
		const result = await db.connection.insert(schema.users).values(testUser);
		const url = `/users/${result.lastInsertRowid}`;

		let [{count = 0} = {}] = await db.connection.all<{count: number}>(sql`SELECT COUNT(*) as count FROM USERS`);
		expect(count).toBe(2);
		const res = await app.request(url, {
			method: "DELETE",
			headers,
		});
		expect(res.status).toBe(200);

		[{count = 0} = {}] = await db.connection.all<{count: number}>(sql`SELECT COUNT(*) as count FROM USERS`);
		expect(count).toBe(1);

		const getRes = await app.request("/users/1", { headers });
		const body: any = await getRes.json();

		expect(body.data.name).toBe("admin");
	}));
	
	test.todo("DELETE /users | batch delete");
});
