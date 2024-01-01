import { describe, it, expect } from "vitest";
import { accessSync } from "fs";
import { join } from "path";
import { getRootDir } from "../getRootDir";

describe("getRootDir", () => {
	it("returns the root path, where package.json is located", () => {
		const rootPath = getRootDir();
		const packageJsonPath = join(rootPath, "package.json");
		expect(() => accessSync(packageJsonPath)).not.toThrow();
	});
});