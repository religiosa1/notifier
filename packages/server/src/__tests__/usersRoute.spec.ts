import { describe, test, expect } from "vitest";
import { withIsolatedAppEnv } from "src/__tests__/withIsolatedAppEnv";
import { AuthorizationEnum, type UserCreate } from "@shared/models";
import { UserRoleEnum } from "@shared/models/UserRoleEnum";
import { di } from "src/injection";
import { schema } from "src/db";
import { sql } from "drizzle-orm";
import type { DatabaseConnectionManager } from "src/db/DatabaseConnectionManager";

describe("users route", () => {
	const testUser: UserCreate = {
		telegramId: 654321,
		name: "John Doe",
	};

	const bulkUsers: UserCreate[] = [
		{
			telegramId: 111111,
			name: "aAdMiNoS",
		},
		{
			telegramId: 222222,
			name: "paqadmin",
		},
		{
			telegramId: 333333,
			name: "johny",
		},
	];

	async function countUsers(db: DatabaseConnectionManager): Promise<number> {
		const [{count = 0} = {}] = await db.connection.all<{count: number}>(
			sql`SELECT COUNT(*) as count FROM USERS`
		);
		return count;
	}

	test("GET /users", withIsolatedAppEnv(async (app, headers) => {
		const res = await app.request("/users", { headers });
		const body: any = await res.json();
		expect(res.status).toBe(200);
		expect(body.data.count).toBe(1);
		expect(body.data.data[0].name).toBe("admin");
	}));

	describe("GET /users/:ID", () => {
		test("returns a user", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users/1", { headers });
			const body: any = await res.json();
			expect(res.status).toBe(200);
			expect(body.data.name).toBe("admin");
		}));

		test("returns 404 on non-existing id", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users/123456", { headers });
			expect(res.status).toBe(404);
		}));
	});

	describe("GET /users/search", () => {
		test("case-insensitive name search", withIsolatedAppEnv(async (app, headers) => {
			const db = di.inject("db");
			await db.connection.insert(schema.users).values(bulkUsers);
			expect(await countUsers(db)).toBe(4);
			
			const res = await app.request("/users/search?name=adm", { headers });
			const body: any = await res.json();
			expect(res.status).toBe(200);
			expect(body.data.length).toBe(3);
		}));

		test("no name o group param is 422", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users/search", { headers });
			expect(res.status).toBe(422);
		}));

		test.todo("search with a group")
	});	

	test("POST /users", withIsolatedAppEnv(async (app, headers) => {
		const res = await app.request("/users", {
			method: "POST",
			headers,
			body: JSON.stringify(testUser)
		});
		expect(res.status).toBe(201);

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

	describe("PUT /users/:ID", () => {
		test("successfully modifies the selected user", withIsolatedAppEnv(async (app, headers) => {
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
		}));

		test("updates modified at time", withIsolatedAppEnv(async (app, headers) => {
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
	
			expect(body.data.createdAt).not.toBe(body.data.updatedAt);
		}));

		test("returns 422 on invalid on bad request", withIsolatedAppEnv(async (app, headers) => {	
			const res = await app.request("/users/1", {
				method: "PUT",
				headers,
				body: JSON.stringify({ foo: "bar" })
			});
			expect(res.status).toBe(422);
		}));


		test("returns 404 on non-existing user", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request('/users/123123', {
				method: "PUT",
				headers,
				body: JSON.stringify(testUser)
			});
			expect(res.status).toBe(404);
		}));
	});

	describe("DELETE /users/:ID", () => {
		test("successfully deletes the selected user", withIsolatedAppEnv(async (app, headers) => {
			const db = di.inject("db");
			const result = await db.connection.insert(schema.users).values(testUser);
			const url = `/users/${result.lastInsertRowid}`;
	
			let count = await countUsers(db);
			expect(count).toBe(2);
			const res = await app.request(url, {
				method: "DELETE",
				headers,
			});
			expect(res.status).toBe(200);
	
			count = await countUsers(db);
			expect(count).toBe(1);
	
			const getRes = await app.request("/users/1", { headers });
			const body: any = await getRes.json();
	
			expect(body.data.name).toBe("admin");
		}));
		
		test("returns 404 on non-existing id", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request('/users/1234567', {
				method: "DELETE",
				headers,
			});
			expect(res.status).toBe(404);
		}));
	});

	describe("DELETE /users | batch delete", () => {
		test("full hit in ids", withIsolatedAppEnv(async (app, headers) => {
			const db = di.inject("db");
			await db.connection.insert(schema.users).values(bulkUsers);
			expect(await countUsers(db)).toBe(4);
			const res = await app.request(`/users?id=2,3,4`, {
				method: "DELETE",
				headers,
			});
			const body: any = await res.json();
			expect(res.status).toBe(200);
			expect(body.data.count).toBe(3);
			expect(body.data.outOf).toBe(3);
			expect(await countUsers(db)).toBe(1);
			const getRes = await app.request(`/users/1`, { headers });
			const getBody: any = await getRes.json();
			expect(getRes.status).toBe(200);
			expect(getBody.data.name).toBe('admin');
		}));

		test("partial hit in ids", withIsolatedAppEnv(async (app, headers) => {
			const db = di.inject("db");
			await db.connection.insert(schema.users).values(bulkUsers);
			expect(await countUsers(db)).toBe(4);
			const res = await app.request(`/users?id=2,3,4,32167`, { // one non-existing id
				method: "DELETE",
				headers,
			});
			const body: any = await res.json();
			expect(res.status).toBe(207);
			expect(body.data.count).toBe(3);
			expect(body.data.outOf).toBe(4);
			expect(await countUsers(db)).toBe(1);
			const getRes = await app.request(`/users/1`, { headers });
			const getBody: any = await getRes.json();
			expect(getRes.status).toBe(200);
			expect(getBody.data.name).toBe('admin');
		}));

		test("no hit in ids", withIsolatedAppEnv(async (app, headers) => {
			const db = di.inject("db");
			await db.connection.insert(schema.users).values(bulkUsers);
			expect(await countUsers(db)).toBe(4);
			const res = await app.request(`/users?id=32167,12332`, { // all ids non-existing
				method: "DELETE",
				headers,
			});
			const body: any = await res.json();
			expect(res.status).toBe(404);
			expect(body.data.count).toBe(0);
			expect(body.data.outOf).toBe(2);
			expect(await countUsers(db)).toBe(4);
		}));

		test("no providing any id will result in 422",  withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request(`/users`, {
				method: "DELETE",
				headers,
			});
			expect(res.status).toBe(422);
		}));
	});
});
