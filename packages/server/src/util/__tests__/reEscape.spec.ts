import { describe, it, expect } from "vitest";
import { reEscape } from "../reEscape";

describe("reEscape", () => {
	it("escapes non-re compatible symbols", () => {
		expect(reEscape`http://example.com/`).toBe("http:\\/\\/example\\.com\\/");
	});

	it("can work as a regular function", () => {
		expect(reEscape("http://example.com/")).toBe("http:\\/\\/example\\.com\\/");
	});
});