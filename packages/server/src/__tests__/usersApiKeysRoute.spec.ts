import { describe, test, expect } from "vitest";
import { withIsolatedAppEnv } from "src/__tests__/withIsolatedAppEnv";
import * as ApiKeyService from "src/services/ApiKey";
import type { ApiKeyPreview, Counted, ResultSuccess } from "@shared/models";

describe("/users/:userId/api-keys route", () => {
	describe("GET /users/:userId/api-keys", () => {
		test(
			"returns a list of users api keys",
			withIsolatedAppEnv(async (app, headers) => {
				await ApiKeyService.createKey(1);
				await ApiKeyService.createKey(1);
				const res = await app.request("/users/1/api-keys", { headers });
				expect(res.status).toBe(200);
				const data = (await res.json()) as ResultSuccess<Counted<ApiKeyPreview[]>>;
				expect(data.data.count).toBe(2);
				expect(data.data.data).toEqual([
					{
						prefix: expect.any(String),
						createdAt: expect.any(String),
					},
					{
						prefix: expect.any(String),
						createdAt: expect.any(String),
					},
				]);
			})
		);

		test(
			"returns an empty list of users if user has none",
			withIsolatedAppEnv(async (app, headers) => {
				const res = await app.request("/users/1/api-keys", { headers });
				expect(res.status).toBe(200);
				const data = (await res.json()) as ResultSuccess<Counted<ApiKeyPreview[]>>;
				expect(data.data.count).toBe(0);
				expect(data.data.data).toEqual([]);
			})
		);

		test(
			"returns 404 on a non-existing user",
			withIsolatedAppEnv(async (app, headers) => {
				const res = await app.request("/users/100500/api-keys", { headers });
				expect(res.status).toBe(404);
			})
		);
	});

	describe("POST /users/:userId/api-keys", () => {
		test("creates a key for user", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users/1/api-keys", { 
				method: "POST",
				headers 
			});
			expect(res.status).toBe(201);
			const body: any = await res.json();
			expect(body.data.apiKey).toBeTypeOf("string");
			const [, keysCount] = await ApiKeyService.listKeys(1);
			expect(keysCount).toBe(1);
		}));

		test("returns 404 on a non-existing user", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request("/users/100500/api-keys", { 
				method: "POST",
				headers 
			});
			expect(res.status).toBe(404);
		}));
	});

	describe("DELETE /users/:userId/api-keys/:prefix", () => {
		test("deletes a key by prefix", withIsolatedAppEnv(async (app, headers) => {
			await ApiKeyService.createKey(1);
			const key = await ApiKeyService.createKey(1);
			const [, keysCount] = await ApiKeyService.listKeys(1);
			const [prefix] = key.split(".", 1);
			expect(keysCount).toBe(2);
			const res = await app.request(`/users/1/api-keys/${encodeURIComponent(prefix!)}`, { 
				method: "DELETE",
				headers 
			});
			expect(res.status).toBe(200);
			const [, updatedKeysCount] = await ApiKeyService.listKeys(1);
			expect(updatedKeysCount).toBe(1);
		}));

		test("returns 404 on a non-existing key by prefix", withIsolatedAppEnv(async (app, headers) => {
			await ApiKeyService.createKey(1);
			const res = await app.request(`/users/1/api-keys/asdfghh`, { 
				method: "DELETE",
				headers 
			});
			expect(res.status).toBe(404);
			const [, keysCount] = await ApiKeyService.listKeys(1);
			expect(keysCount).toBe(1);
		}));

		
		test("returns 404 on a non-existing user", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request(`/users/100500/api-keys/asdfghh`, { 
				method: "DELETE",
				headers 
			});
			expect(res.status).toBe(404);
		}));
	});

	describe("DELETE /users/:userId/api-keys", () => {
		test("deletes all of the user keys", withIsolatedAppEnv(async (app, headers) => {
			await ApiKeyService.createKey(1);
			await ApiKeyService.createKey(1);
			const [, keysCount] = await ApiKeyService.listKeys(1);
			expect(keysCount).toBe(2);
			const res = await app.request(`/users/1/api-keys`, { 
				method: "DELETE",
				headers 
			});
			expect(res.status).toBe(200);
			const [, updatedKeysCount] = await ApiKeyService.listKeys(1);
			expect(updatedKeysCount).toBe(0);
		}));
		test("returns 404 on a non-existing user", withIsolatedAppEnv(async (app, headers) => {
			const res = await app.request(`/users/100500/api-keys`, { 
				method: "DELETE",
				headers 
			});
			expect(res.status).toBe(404);
		}));
	});
});
