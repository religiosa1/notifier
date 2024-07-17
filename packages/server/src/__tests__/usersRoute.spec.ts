import { describe, test, expect, vi } from "vitest";
import { withIsolatedAppEnv } from "src/__tests__/withIsolatedAppEnv";
import { AuthorizationEnum, type Counted, type ResultSuccess, type User, type UserCreate, type UserDetail } from "@shared/models";
import { UserRoleEnum } from "@shared/models/UserRoleEnum";
import { di } from "src/injection";
import { schema } from "src/db";
import { eq, sql } from "drizzle-orm";

describe("users route", () => {
	const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/;

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

	async function insertUsersBulk(users = bulkUsers) {
		const usersRepo = di.inject("UsersRepository");
		for (const user of users) {
			await usersRepo.insertUser(user);
		}
	}

	async function countUsers(): Promise<number> {
		const db = di.inject("db");
		const [{count = 0} = {}] = await db.connection.all<{count: number}>(
			sql`SELECT COUNT(*) as count FROM USERS`
		);
		return count;
	}

	async function getUserChannels(userId: number): Promise<Array<{ id: number }>> {
		const db = di.inject("db");
		const channels = await db.connection
			.select({ id: schema.usersToChannels.channelId })
			.from(schema.usersToChannels)
			.where(eq(schema.usersToChannels.userId, userId));
		return channels;
	}

	describe("GET /users", () => {
		test("returns a list of users", withIsolatedAppEnv(async (app, headers) => {
			await insertUsersBulk();
			const res = await app.request("/users", { headers });
			const body = await res.json() as ResultSuccess<Counted<User[]>>;
			expect(res.status).toBe(200);
			expect(body.data.count).toBe(4);
			expect(body.data.data.length).toBe(4);
			expect(body.data.data[0]!.name).toBe("admin");
		}));

		test("allows control of page size", withIsolatedAppEnv(async (app, headers) => {
			await insertUsersBulk();
			const res = await app.request("/users?take=2", { headers });
			const body = await res.json() as ResultSuccess<Counted<User[]>>;
			expect(res.status).toBe(200);
			expect(body.data.count).toBe(4);
			expect(body.data.data.length).toBe(2);
			expect(body.data.data[0]!.name).toBe("admin");
		}));

		test("allows specifying skip param", withIsolatedAppEnv(async (app, headers) => {
			await insertUsersBulk();
			const res = await app.request("/users?take=2&skip=1", { headers });
			const body = await res.json() as ResultSuccess<Counted<User[]>>;
			expect(res.status).toBe(200);
			expect(body.data.count).toBe(4);
			expect(body.data.data.length).toBe(2);
			expect(body.data.data[0]!.name).toBe(bulkUsers[0]!.name);
		}));
	});

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
			await insertUsersBulk();
			expect(await countUsers()).toBe(4);
			
			const res = await app.request("/users/search?name=adm", { headers });
			const body: any = await res.json();
			expect(res.status).toBe(200);
			expect(body.data.length).toBe(3);
		}));

		test("no name or notInGroup param is 422", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users/search", { headers });
			expect(res.status).toBe(422);
		}));
		
		test("search omitting a group", withIsolatedAppEnv(async (app, headers) => {
			await insertUsersBulk(bulkUsers.map((user, i) => { 
				if (i % 2) {
					return {...user, groups: [1] };
				}
				return user;
			}));
			expect(await countUsers()).toBe(4);
			
			const res = await app.request("/users/search?name=adm&notInGroup=1", { headers });
			const body: any = await res.json();
			expect(res.status).toBe(200);
			 // "admin" and "paqadmin" are filtered out by group, and "johny" filtered out by name
			expect(body.data.length).toBe(1);
			expect(body.data[0]!.name).toBe("aAdMiNoS"); 
		}));

		test("search by notInGroup only", withIsolatedAppEnv(async (app, headers) => {
			await insertUsersBulk(bulkUsers.map((user, i) => { 
				if (i % 2) {
					return {...user, groups: [1] };
				}
				return user;
			}));
			expect(await countUsers()).toBe(4);
			
			const res = await app.request("/users/search?notInGroup=1", { headers });
			const body: any = await res.json();
			expect(res.status).toBe(200);
			 // "admin" and "paqadmin" are filtered out by group
			expect(body.data.length).toBe(2);
			expect(body.data[0]!.name).toBe("aAdMiNoS");
			expect(body.data[1]!.name).toBe("johny"); 
		}));
	});

	describe("POST /users", () => {
		test("creates a new user", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users", {
				method: "POST",
				headers,
				body: JSON.stringify(testUser)
			});
			expect(res.status).toBe(201);
			const body = await res.json() as ResultSuccess<UserDetail>;
	
			expect(body.data.name).toBe(testUser.name);
			expect(body.data.telegramId).toBe(testUser.telegramId);
			expect(body.data.password).toBe(null);
			expect(body.data.role).toBe(UserRoleEnum.regular);
			expect(body.data.authorizationStatus).toBe(AuthorizationEnum.pending);
			expect(body.data.createdAt).toMatch(isoDateRegex);
			expect(body.data.updatedAt).toMatch(isoDateRegex);
		}));

		test("allows to specify initial groups", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users", {
				method: "POST",
				headers,
				body: JSON.stringify({...testUser, groups: [ 1 ] } satisfies UserCreate)
			});
			const body = await res.json() as ResultSuccess<UserDetail>;
			expect(res.status).toBe(201);
			expect(body.data.groups).toEqual([
				{ id: 1, name: "default" }
			]);
		}));

		test("allows to specify initial channels", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users", {
				method: "POST",
				headers,
				body: JSON.stringify({
					...testUser, 
					groups: [ 1 ], 
					channels: [ 1 ] 
				} satisfies UserCreate)
			});
			expect(res.status).toBe(201);
			const channels = await getUserChannels(1);
			expect(channels).toEqual([ { id: 1 }])
		}));

		test("bad input results in 422 error", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users", {
				method: "POST",
				headers,
				body: JSON.stringify({ name: "123" }) // telegramId is ommited
			});
			expect(res.status).toBe(422);
		}));
	});
	

	describe("PUT /users/:ID", () => {
		test("successfully modifies the selected user", withIsolatedAppEnv(async (app, headers) => {
			const usersRepo = di.inject("UsersRepository");
			const { id } = await usersRepo.insertUser(testUser);
			const url = `/users/${id}`;
	
			const res = await app.request(url, {
				method: "PUT",
				headers,
				body: JSON.stringify({ ...testUser, name: "Jane Doe" })
			});
			const body = await res.json() as ResultSuccess<UserDetail>;
			expect(res.status).toBe(200);
			expect(body.data.name).toBe("Jane Doe");
		}));

		test("updates modified at time", withIsolatedAppEnv(async (app, headers) => {
			try {
				vi.useFakeTimers();
				const usersRepo = di.inject("UsersRepository");
				const { id } = await usersRepo.insertUser(testUser);
				const url = `/users/${id}`;
	
				vi.advanceTimersByTime(1000);
		
				const res = await app.request(url, {
					method: "PUT",
					headers,
					body: JSON.stringify({ ...testUser, name: "Jane Doe" })
				});
				const body = await res.json() as ResultSuccess<UserDetail>;
				expect(res.status).toBe(200);
		
				expect(body.data.updatedAt).toMatch(isoDateRegex);
				expect(body.data.createdAt).toMatch(isoDateRegex);
				expect(body.data.createdAt).not.toBe(body.data.updatedAt);
			} finally {
				vi.useRealTimers();
			}
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

		test("setting groups", withIsolatedAppEnv(async (app, headers) => {
			const usersRepo = di.inject("UsersRepository");
			const user = await usersRepo.insertUser(testUser);
			expect(user.groups).toEqual([]);

			const res = await app.request(`/users/${user.id}`, {
				method: "PUT",
				headers,
				body: JSON.stringify({
					...testUser,
					groups: [ 1 ],
				})
			});
			const body = await res.json() as ResultSuccess<UserDetail>;
			expect(res.status).toBe(200);
			expect(body.data.groups).toEqual([
				{ id: 1, name: "default" }
			]);
		}));

		test("removing groups if empty array is passed", withIsolatedAppEnv(async (app, headers) => {
			const usersRepo = di.inject("UsersRepository");
			const user = await usersRepo.insertUser({ ...testUser, groups: [1] });
			expect(user.groups.length).toBe(1);

			const res = await app.request(`/users/${user.id}`, {
				method: "PUT",
				headers,
				body: JSON.stringify({
					...testUser,
					groups: [],
				})
			});
			const body = await res.json() as ResultSuccess<UserDetail>;
			expect(res.status).toBe(200);
			expect(body.data.groups).toEqual([]);
		}));

		test("doesn't modify groups if groups is not specifed in payload", withIsolatedAppEnv(async (app, headers) => {
			const usersRepo = di.inject("UsersRepository");
			const user = await usersRepo.insertUser({ ...testUser, groups: [1] });
			expect(user.groups.length).toBe(1);

			const res = await app.request(`/users/${user.id}`, {
				method: "PUT",
				headers,
				body: JSON.stringify({
					...testUser,
					groups: undefined,
				})
			});
			const body = await res.json() as ResultSuccess<UserDetail>;
			expect(res.status).toBe(200);
			expect(body.data.groups.length).toBe(1);
		}));

		test("setting channels", withIsolatedAppEnv(async (app, headers) => {
			const usersRepo = di.inject("UsersRepository");
			const user = await usersRepo.insertUser({ ...testUser, groups: [1] });
			expect(await getUserChannels(user.id)).toEqual([]);

			const res = await app.request(`/users/${user.id}`, {
				method: "PUT",
				headers,
				body: JSON.stringify({
					...testUser,
					channels: [ 1 ]
				})
			});
			expect(res.status).toBe(200);
			expect(await getUserChannels(user.id)).toEqual([{id: 1}]);
		}));

		test("removing channels", withIsolatedAppEnv(async (app, headers) => {
			const usersRepo = di.inject("UsersRepository");
			const user = await usersRepo.insertUser({ ...testUser, groups: [1], channels: [1] });
			expect(await getUserChannels(user.id)).toEqual([{id: 1}]);

			const res = await app.request(`/users/${user.id}`, {
				method: "PUT",
				headers,
				body: JSON.stringify({
					...testUser,
					channels: []
				})
			});
			expect(res.status).toBe(200);
			expect(await getUserChannels(user.id)).toEqual([]);
		}));

		test("doesn't modify channels if channels is not specifed in payload", withIsolatedAppEnv(async (app, headers) => {
			const usersRepo = di.inject("UsersRepository");
			const user = await usersRepo.insertUser({ ...testUser, groups: [1], channels: [1] });
			expect(await getUserChannels(user.id)).toEqual([{id: 1}]);

			const res = await app.request(`/users/${user.id}`, {
				method: "PUT",
				headers,
				body: JSON.stringify({
					...testUser,
					channels: undefined
				})
			});
			expect(res.status).toBe(200);
			expect(await getUserChannels(user.id)).toEqual([{id: 1}]);
		}));
	});

	describe("DELETE /users/:ID", () => {
		test("successfully deletes the selected user", withIsolatedAppEnv(async (app, headers) => {
			const usersRepo = di.inject("UsersRepository");
			const { id } = await usersRepo.insertUser(testUser);
			const url = `/users/${id}`;
	
			let count = await countUsers();
			expect(count).toBe(2);
			const res = await app.request(url, {
				method: "DELETE",
				headers,
			});
			expect(res.status).toBe(200);
	
			count = await countUsers();
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
			await insertUsersBulk();
			expect(await countUsers()).toBe(4);
			const res = await app.request(`/users?id=2,3,4`, {
				method: "DELETE",
				headers,
			});
			const body: any = await res.json();
			expect(res.status).toBe(200);
			expect(body.data.count).toBe(3);
			expect(body.data.outOf).toBe(3);
			expect(await countUsers()).toBe(1);
			const getRes = await app.request(`/users/1`, { headers });
			const getBody: any = await getRes.json();
			expect(getRes.status).toBe(200);
			expect(getBody.data.name).toBe('admin');
		}));

		test("partial hit in ids returns 207", withIsolatedAppEnv(async (app, headers) => {
			await insertUsersBulk();
			expect(await countUsers()).toBe(4);
			const res = await app.request(`/users?id=2,3,4,32167`, { // one non-existing id
				method: "DELETE",
				headers,
			});
			const body: any = await res.json();
			expect(res.status).toBe(207);
			expect(body.data.count).toBe(3);
			expect(body.data.outOf).toBe(4);
			expect(await countUsers()).toBe(1);
			const getRes = await app.request(`/users/1`, { headers });
			const getBody: any = await getRes.json();
			expect(getRes.status).toBe(200);
			expect(getBody.data.name).toBe('admin');
		}));

		test("no hit in ids returns 404", withIsolatedAppEnv(async (app, headers) => {
			await insertUsersBulk();
			expect(await countUsers()).toBe(4);
			const res = await app.request(`/users?id=32167,12332`, { // all ids non-existing
				method: "DELETE",
				headers,
			});
			const body: any = await res.json();
			expect(res.status).toBe(404);
			expect(body.data.count).toBe(0);
			expect(body.data.outOf).toBe(2);
			expect(await countUsers()).toBe(4);
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
