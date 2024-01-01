import { describe, it, expect, vi, afterAll } from "vitest";
import { accessSync } from "fs";
import { dirname, join } from "path";
import { getRootDir } from "../getRootDir";
import { fileURLToPath } from "url";

describe("getRootDir", () => {
	afterAll(() => { vi.unstubAllEnvs() });
	it("on dev returns the root path, where package.json is located", () => {
		const rootPath = getRootDir();
		const packageJsonPath = join(rootPath, "package.json");
		expect(() => accessSync(packageJsonPath)).not.toThrow();
	});

	it("on prod environment root dir is considered to be the same dir, as bundle dirname", () => {
		vi.stubEnv('NODE_ENV', 'production');
		const rootPath = getRootDir();
		const testDir = fileURLToPath(import.meta.url);
		const expectedResult = dirname(dirname(testDir)); 
		expect(rootPath).toBe(expectedResult);
	});
});