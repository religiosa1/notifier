import { describe, test, expect } from "vitest";
import { withIsolatedAppEnv } from "src/__tests__/withIsolatedAppEnv";

describe("Smoke test and login", () => {
	test("GET /", withIsolatedAppEnv(
		async (app) => {
			const res = await app.request("/");
			const text = await res.text();
			expect(text).toBe("");
			expect(res.status).toBe(204);
		},
		{ omitAuth: true }
	));

	test("POST /login | correct credentials", withIsolatedAppEnv(
		async (app, headers) => {
			const res = await app.request("/login", {
				method: "POST",
				headers,
				body: JSON.stringify({
					name: "admin",
					password: "123456",
				}),
			});
			const body = (await res.json()) as any;
			expect(body.data.token).toBeTypeOf("string");
			expect(res.status).toBe(200);
		},
		{ omitAuth: true }
	));

	test("POST /login | invalid credentials", withIsolatedAppEnv(
		async (app, headers) => {
			const res = await app.request("/login", {
				method: "POST",
				headers,
				body: JSON.stringify({
					name: "admin",
					password: "bad password",
				}),
			});
			expect(res.status).toBe(401);
		},
		{ omitAuth: true }
	));
});
