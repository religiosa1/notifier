import { describe, test, expect } from "vitest";
import { buildApp } from "src/app";
import { di } from "src/injection";
import { testConfig } from "src/__tests__/testConfig";

describe("Smoke test and login", () => {
  test("GET /", () => di.clone().run(async () => {
    di.inject("SettingsService").setConfig(testConfig);
    const app = buildApp();
    const res = await app.request('/');
    const text = await res.text();
    expect(text).toBe('');
    expect(res.status).toBe(204);
  }));

  test("POST /login | correct credentials", () => di.clone().run(async () => {
    di.inject("SettingsService").setConfig(testConfig);
    const dbMigrator = di.inject("DatabaseMigrator");
    await dbMigrator.migrate();
    await dbMigrator.seed("123456", 123456);

    const app = buildApp();
    const res = await app.request('/login', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        name: "admin",
        password: "123456",
      })
    });
    const body = await res.json() as any;
    expect(body.data.token).toBeTypeOf("string");
    expect(res.status).toBe(200);
  }));

  test("POST /login | invalid credentials", () => di.clone().run(async () => {
    di.inject("SettingsService").setConfig(testConfig);
    const dbMigrator = di.inject("DatabaseMigrator");
    await dbMigrator.migrate();
    await dbMigrator.seed("123456", 123456);

    const app = buildApp();
    const res = await app.request('/login', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        name: "admin",
        password: "bad password",
      })
    });
    expect(res.status).toBe(401);
  }));
});