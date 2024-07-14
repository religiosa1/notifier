import { describe, test, expect, beforeAll } from "vitest";
import { app } from "src/app";
import { di } from "src/injection";
import { testConfig } from "src/__tests__/testConfig";

describe('Smoke test', () => {
  beforeAll(() => {
    const settingsService = di.inject("SettingsService");
    settingsService.setConfig(testConfig);
  });

  test('GET /', async () => {
    const res = await app.request('/')
    const text = await res.text();
    expect(text).toBe('')
    expect(res.status).toBe(204)
  });
});