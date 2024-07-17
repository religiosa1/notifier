import { withIsolatedAppEnv } from "src/__tests__/withIsolatedAppEnv";
import { di } from "src/injection";
import { schema } from "src/db";
import { describe, test, expect } from "vitest";

describe("/users/:userId/channels route", () => {
	async function createGroup(name: string) {
		const groupRepo = di.inject("GroupsRepository");
		const { id } = await groupRepo.insertGroup(name);
		return id;
	}
	async function createChannel(groupId: number, channelName: string) {
		const ctgRepo = di.inject("ChannelToGroupRelationsRepository");
		await ctgRepo.connectOrCreateChannelToGroup(groupId, channelName);
	}

	async function bulkConnectChannelsToUser(
		userId: number, 
		thruGroupId: number, 
		channelNames: string[] = [ "test1", "test2", "test3" ]
	) {
		const ctgRepo = di.inject("ChannelToGroupRelationsRepository");
		const utcRepo = di.inject("UserToChannelRelationsRepository");
		for (const channelName of channelNames) {
			const [channelId] = await ctgRepo.connectOrCreateChannelToGroup(thruGroupId, channelName);
			await utcRepo.connectUserChannel(userId, channelId);
		}
	}

	async function getUserChannels(userId: number) {
		const utcRepo = di.inject("UserToChannelRelationsRepository");
		return utcRepo.listUserChannels(userId);
	}

	describe("GET /users/:userId/channels", () => {
		test("returns a list of connected user channels", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users/1/channels", { headers });
			const body: any = await res.json();
			expect(res.status).toBe(200);
			expect(body.data.count).toBe(1);
			expect(body.data.data).toEqual([
				{ 
					id: 1, 
					name: "default",
					createdAt: expect.any(String),
					updatedAt: expect.any(String),
				}
			]);
		}));
		test("returns 404 on non-existing user", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users/100500/channels", { headers });
			expect(res.status).toBe(404);
		}));
	});

	describe("GET /users/:userId/channels/available", () => {
		test("returns a list of channels that a user can connect", withIsolatedAppEnv(async (app, headers) => {
			const groupId = await createGroup("testgroup");
			await createChannel(1, "test");
			await createChannel(groupId, "test2"); // group not connected to user
			const res = await app.request("/users/1/channels/available", { headers });
			const body: any = await res.json();
			expect(res.status).toBe(200);
			expect(body.data).toEqual([
				{ 
					id: 2, 
					name: "test",
					createdAt: expect.any(String),
					updatedAt: expect.any(String),
				}
			]);
		}));

		test("returns 404 on non-existing user", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users/100500/channels/available", { headers });
			expect(res.status).toBe(404);
		}));
	});
	

	describe("POST /users/:userId/channels", () => {
		test("connects an existing channel to user", withIsolatedAppEnv(async (app, headers) => {
			await createChannel(1, "test")
			const res = await app.request(`/users/1/channels`, { 
				method: "POST",
				headers,
				body: JSON.stringify({ id: 2 }),
			});
			expect(res.status).toBe(200);
			const { count } = await getUserChannels(1);
			expect(count).toBe(2);
		}));

		test("returns 404 on non-existing user", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request(`/users/100500/channels`, { 
				method: "POST",
				headers,
				body: JSON.stringify({ id: 1 }),
			});
			expect(res.status).toBe(404);
		}));

		test("returns 404 on non-existing channel", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request(`/users/1/channels`, { 
				method: "POST",
				headers,
				body: JSON.stringify({ id: 2 }),
			});
			expect(res.status).toBe(404);
		}));

		test("returns 400 on connecting a channel, with unsufficient groups", withIsolatedAppEnv(async (app, headers) => {
			const db = di.inject("db");
			await db.connection.insert(schema.groups).values({
				name: "test"
			});
			await createChannel(2, "test");
			const res = await app.request(`/users/1/channels`, { 
				method: "POST",
				headers,
				body: JSON.stringify({ id: 2 }),
			});
			expect(res.status).toBe(400);
		}));

		test("returns 422 on misformed data", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request(`/users/1/channels`, { 
				method: "POST",
				headers,
				body: JSON.stringify({ id: "asdfadsf" }),
			});
			expect(res.status).toBe(422);
		}));
	});

	describe("DELETE /users/:userId/channels", () => {
		test("deletes a list of channels", withIsolatedAppEnv(async (app, headers) => {
			await bulkConnectChannelsToUser(1, 1);
			const res = await app.request(`/users/1/channels?id=3,4`, { 
				method: "DELETE",
				headers
			});
			expect(res.status).toBe(200);
			const { data: channels } = await getUserChannels(1);
			expect(channels).toEqual([ 
				{
					id: 1,
					name: "default",
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
				},
				{
					id: 2,
					name: "test1",
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
				},
			]);
		}));
		test("returns 207 on partial deletes", withIsolatedAppEnv(async (app, headers) => {
			await bulkConnectChannelsToUser(1, 1);
			const res = await app.request(`/users/1/channels?id=3,4,100500`, { 
				method: "DELETE",
				headers
			});
			expect(res.status).toBe(207);
			const { data: channels } = await getUserChannels(1);
			expect(channels).toEqual([ 
				{
					id: 1,
					name: "default",
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
				},
				{
					id: 2,
					name: "test1",
					createdAt: expect.any(Date),
					updatedAt: expect.any(Date),
				},
			]);
		}));
		test("returns 404 on a non-existing user", withIsolatedAppEnv(async (app, headers) => {
			await bulkConnectChannelsToUser(1, 1);
			const res = await app.request(`/users/100500/channels?id=100500,100501`, { 
				method: "DELETE",
				headers
			});
			expect(res.status).toBe(404);
		}));
		test("returns 404 when no id hit occured", withIsolatedAppEnv(async (app, headers) => {
			await bulkConnectChannelsToUser(1, 1);
			const res = await app.request(`/users/1/channels?id=100500,100501`, { 
				method: "DELETE",
				headers
			});
			expect(res.status).toBe(404);
			const { count } = await getUserChannels(1);
			expect(count).toBe(4);
		}));
		test("returns 422 on no ids in searchQuery", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request(`/users/1/channels`, { 
				method: "DELETE",
				headers
			});
			expect(res.status).toBe(422);
			const { count } = await getUserChannels(1);
			expect(count).toBe(1);
		}));
	});
});